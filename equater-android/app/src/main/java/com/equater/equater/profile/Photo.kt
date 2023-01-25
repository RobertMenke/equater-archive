package com.equater.equater.profile

import android.content.Context
import android.graphics.Bitmap
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import androidx.annotation.DrawableRes
import androidx.compose.runtime.Composable
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.Dp
import androidx.core.graphics.drawable.toBitmap
import coil.ImageLoader
import coil.annotation.ExperimentalCoilApi
import coil.compose.AsyncImagePainter
import coil.compose.rememberAsyncImagePainter
import coil.decode.DataSource
import coil.disk.DiskCache
import coil.memory.MemoryCache
import coil.request.CachePolicy
import coil.request.ErrorResult
import coil.request.ImageRequest
import coil.request.SuccessResult
import com.equater.equater.BuildConfig
import com.equater.equater.R
import com.equater.equater.authentication.Institution
import com.equater.equater.authentication.User
import com.equater.equater.extensions.canStore
import com.equater.equater.global.SHARED_PREFERENCES_KEY
import com.equater.equater.searchVendors.Vendor
import com.equater.equater.utils.readBitmap
import com.equater.equater.utils.urlIsExpired
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import timber.log.Timber
import java.io.File

private const val COVER_PHOTO_CACHE_KEY = "COVER_PHOTO_CACHE"
private const val PROFILE_PHOTO_CACHE_KEY = "PROFILE_PHOTO_CACHE"
private const val VENDOR_LOGO_CACHE_KEY = "VENDOR_LOGO_CACHE"
private const val PLAID_INSTITUTION_CACHE_KEY = "PLAID_INSTITUTION_CACHE"

// Note: This will never be used to save a local image to disk
private const val LOCAL_IMAGE_CACHE_KEY = "LOCAL_IMAGE_CACHE_KEY"
private val ioScope = CoroutineScope(Job() + Dispatchers.IO)

enum class PhotoResourceType {
    Local, Remote, Default
}

sealed class Photo(val context: Context) {
    private val preferences = context.getSharedPreferences(SHARED_PREFERENCES_KEY, Context.MODE_PRIVATE)
    private var usingDefaultImage = false

    @OptIn(ExperimentalCoilApi::class)
    private val imageLoader = ImageLoader.Builder(context)
        .memoryCache {
            MemoryCache.Builder(context)
                .maxSizePercent(0.25)
                .build()
        }
        .diskCache {
            DiskCache.Builder()
                .directory(context.cacheDir.resolve("image_cache"))
                .maxSizePercent(0.5)
                .build()
        }
        .build()

    /**
     * Attempts to get an image from the memory cache, then the disk cache, then the network. The placeholder
     * image is set to the [Drawable?] resulting from [getDefaultImage].
     */
    @OptIn(ExperimentalCoilApi::class)
    @Composable
    fun makeImagePainter(): AsyncImagePainter {
        return rememberAsyncImagePainter(model = makeImageRequest(), contentScale = ContentScale.Crop)
    }

    @Composable
    fun makeFallbackImagePainter(): AsyncImagePainter {
        return rememberAsyncImagePainter(model = getDefaultImage())
    }

    suspend fun getBitmap(): Bitmap? {
        if (fileExistsOnDisk() && !shouldInvalidateCache()) {
            return getFileFromDisk()
        }

        val request = makeImageRequest()
        val drawable = when (val result = imageLoader.execute(request)) {
            is SuccessResult -> result.drawable
            is ErrorResult -> return null
        }

        return (drawable as? BitmapDrawable)?.bitmap
    }

    suspend fun cache() {
        // Check if already cached
        if (fileExistsOnDisk() && !shouldInvalidateCache()) {
            return
        }

        val result = imageLoader.execute(makeImageRequest())

        if (result is SuccessResult && result.dataSource == DataSource.NETWORK) {
            saveFileToDisk(result.drawable)
            setCacheKey()
        }
    }

    fun makeImageRequest(): ImageRequest {
        val remoteUrl = getRemoteUrl()
        val hash = getHash()
        val localFile = getFileFromDisk()
        val cachePolicy = if (shouldInvalidateCache()) CachePolicy.DISABLED else CachePolicy.ENABLED
        val resourceType = if (this is LocalImage) {
            PhotoResourceType.Local
        } else {
            when {
                localFile != null -> PhotoResourceType.Local
                remoteUrl != null -> PhotoResourceType.Remote
                else -> PhotoResourceType.Default
            }
        }

        usingDefaultImage = resourceType == PhotoResourceType.Default

        val requestBuilder = ImageRequest
            .Builder(context)
            .data(if (this is LocalImage) drawableId else localFile ?: remoteUrl)
            .diskCachePolicy(cachePolicy)
            .memoryCachePolicy(cachePolicy)
            .diskCacheKey(hash)
            .memoryCacheKey(hash)
            .setParameter("resource_type", resourceType)
            .crossfade(false)
            .listener(
                onSuccess = { _, result ->
                    if (result.dataSource == DataSource.NETWORK) {
                        saveFileToDisk(result)
                        setCacheKey()
                    }
                }
            )

        val defaultImage = getDefaultImage()

        if (defaultImage != null) {
            requestBuilder.placeholder(defaultImage)
            requestBuilder.error(defaultImage)
        }

        return requestBuilder.build()
    }

    fun getDefaultImageSize(fullSize: Dp) = when (this) {
        is Avatar -> fullSize / 2
        is CoverPhoto -> fullSize
        is LocalImage -> fullSize
        is PlaidInstitution -> fullSize
        is VendorLogo -> fullSize / 2
    }

    fun usingDefaultImage() = usingDefaultImage

    fun remoteUrlIsExpired(): Boolean {
        val url = getRemoteUrl() ?: return false

        return urlIsExpired(url)
    }

    private fun getRemoteUrl(): String? {
        return when (this) {
            is Avatar -> user.preSignedPhotoDownloadUrl
            is CoverPhoto -> user.preSignedCoverPhotoDownloadUrl
            is PlaidInstitution -> institution.logoUrl
            is VendorLogo -> vendor.logoUrl
            is LocalImage -> null
        }
    }

    private fun getHash(): String? {
        return when (this) {
            is Avatar -> user.profilePhotoSha256Hash
            is CoverPhoto -> user.coverPhotoSha256Hash
            is PlaidInstitution -> institution.logoSha256Hash
            is VendorLogo -> vendor.logoSha256Hash
            is LocalImage -> null
        }
    }

    private fun getDefaultImage(): Int? {
        return when (this) {
            is Avatar -> R.drawable.user_profile
            is CoverPhoto -> null
            is PlaidInstitution -> R.drawable.wallet
            is VendorLogo -> R.drawable.shopping_bag
            is LocalImage -> drawableId
        }
    }

    private fun getCacheKey(): String {
        val key = when (this) {
            is Avatar -> "$PROFILE_PHOTO_CACHE_KEY-${user.id}"
            is CoverPhoto -> "$COVER_PHOTO_CACHE_KEY-${user.id}"
            is PlaidInstitution -> "$PLAID_INSTITUTION_CACHE_KEY-${institution.id}"
            is VendorLogo -> "$VENDOR_LOGO_CACHE_KEY-${vendor.id}"
            is LocalImage -> "$LOCAL_IMAGE_CACHE_KEY-$drawableId"
        }

        return "${BuildConfig.ENVIRONMENT}-$key"
    }

    private fun getFileFromDisk(): Bitmap? {
        if (!fileExistsOnDisk() || shouldInvalidateCache()) {
            return null
        }

        return getLocalFile().readBitmap(context)
    }

    private fun saveFileToDisk(drawable: Drawable) = ioScope.launch {
        if (this@Photo is LocalImage) {
            return@launch
        }

        val bitmap = drawable.toBitmap()

        if (context.canStore(bitmap)) {
            bitmap.compress(Bitmap.CompressFormat.JPEG, 100, getLocalFile().outputStream())
        } else {
            Timber.d("Did not store $this because the user is out of space")
        }
    }

    private fun saveFileToDisk(result: SuccessResult) = ioScope.launch {
        if (this@Photo is LocalImage) {
            return@launch
        }

        val bitmap = result.drawable.toBitmap()
        if (context.canStore(bitmap)) {
            try {
                getLocalFile().outputStream().use {
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 100, it)
                }
            } catch (e: Throwable) {
                Timber.e("saveFileToDisk ${e.message} with ${getCacheKey()}")
            }
        } else {
            Timber.d("Did not store $this because the user is out of space")
        }
    }

    private fun fileExistsOnDisk(): Boolean {
        return getLocalFile().exists()
    }

    private fun getLocalFile(): File {
        return File("${context.filesDir}/${getCacheKey()}")
    }

    private fun shouldInvalidateCache(): Boolean {
        val cachedHash = preferences.getString(getCacheKey(), null) ?: return true

        return cachedHash != getHash()
    }

    private fun setCacheKey() {
        preferences.edit().putString(getCacheKey(), getHash()).apply()
    }

    override fun toString(): String {
        return when (this) {
            is Avatar -> "user avatar photo for user id ${user.id}"
            is CoverPhoto -> "user cover photo for user id ${user.id}"
            is PlaidInstitution -> "plaid institution logo for institution ${institution.name}"
            is VendorLogo -> "vendor logo photo for vendor id ${vendor.id}"
            is LocalImage -> "local image with drawable id $drawableId"
        }
    }
}

// / Circular avatar photo
class Avatar(context: Context, val user: User) : Photo(context)

// / Rectangular cover photo (sits behind avatar)
class CoverPhoto(context: Context, val user: User) : Photo(context)

// / Vendor logo
class VendorLogo(context: Context, val vendor: Vendor) : Photo(context)

// / Plaid Institution
class PlaidInstitution(context: Context, val institution: Institution) : Photo(context)

// / Local Image - here for compatibility with various image painter scenarios
class LocalImage(context: Context, @DrawableRes val drawableId: Int) : Photo(context)
