package com.equater.equater.profile

import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import android.os.Environment
import androidx.core.content.FileProvider
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.work.OneTimeWorkRequest
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf
import com.equater.equater.authentication.User
import com.equater.equater.background.FILE_URL
import com.equater.equater.background.PHOTO_TYPE
import com.equater.equater.background.UPLOAD_URL
import com.equater.equater.background.UploadProfilePhotoWorker
import com.equater.equater.database.repository.UserRepository
import com.equater.equater.extensions.findTargetWidthAndHeight
import com.equater.equater.extensions.scaleRespectingAspectRatio
import com.equater.equater.global.SignInEvent
import com.equater.equater.utils.decodeBitmap
import com.equater.equater.utils.writeBitmap
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.greenrobot.eventbus.EventBus
import org.greenrobot.eventbus.Subscribe
import org.greenrobot.eventbus.ThreadMode
import timber.log.Timber
import java.io.File
import java.io.IOException
import java.util.UUID
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    // TODO: remove this context injection when image handling is refactored
    private val context: Context,
    private val userRepository: UserRepository
) : ViewModel() {

    val isSelectingCoverPhoto = MutableStateFlow(false)

    val coverPhoto = MutableStateFlow<Bitmap?>(null)

    val avatarPhoto = MutableStateFlow<Bitmap?>(null)

    val currentCoverPhoto = MutableStateFlow<Bitmap?>(null)

    val currentAvatarPhoto = MutableStateFlow<Bitmap?>(null)

    val isLoading = MutableStateFlow(false)

    init {
        EventBus.getDefault().register(this)
    }

    // When the screen initially loads, set the current first/last name equal to the user's first/last name
    fun setUser(user: User) {
        val coverPhoto = CoverPhoto(context, user)
        val avatar = Avatar(context, user)

        viewModelScope.launch(Dispatchers.IO) {
            coverPhoto.getBitmap()?.let { bitmap -> currentCoverPhoto.value = bitmap }
            avatar.getBitmap()?.let { bitmap -> currentAvatarPhoto.value = bitmap }
        }
    }

    fun setIsSelectingCoverPhoto(selection: Boolean) {
        isSelectingCoverPhoto.value = selection
    }

    fun setCoverPhoto(context: Context, uri: Uri?) {
        uri?.let { imageUri ->
            try {
                coverPhoto.value = imageUri.decodeBitmap(context)
            } catch (e: IOException) {
                Timber.e(e)
            }
        }
    }

    fun setAvatarPhoto(context: Context, uri: Uri?) {
        uri?.let { imageUri ->
            try {
                avatarPhoto.value = imageUri.decodeBitmap(context)
            } catch (e: IOException) {
                Timber.e(e)
            }
        }
    }

    fun makeAvatarUri(context: Context, user: User): Uri? {
        return context.getExternalFilesDir(Environment.DIRECTORY_PICTURES)?.run {
            val fileName = "$absolutePath/avatar-${user.uuid}"
            val file = File(fileName)

            if (file.exists()) {
                file.delete()
            }

            file.createNewFile()
            FileProvider.getUriForFile(context, context.applicationContext.packageName + ".provider", file)
        }
    }

    fun getAvatarFile(context: Context, user: User): File? {
        return context.getExternalFilesDir(Environment.DIRECTORY_PICTURES)?.run {
            File("$absolutePath/avatar-${user.uuid}")
        }
    }

    fun makeCoverPhotoUri(context: Context, user: User): Uri? {
        return context.getExternalFilesDir(Environment.DIRECTORY_PICTURES)?.run {
            val file = File("$absolutePath/cover-photo-${user.uuid}")
            file.createNewFile()
            FileProvider.getUriForFile(context, context.applicationContext.packageName + ".provider", file)
        }
    }

    fun getCoverPhoto(context: Context, user: User): File? {
        return context.getExternalFilesDir(Environment.DIRECTORY_PICTURES)?.run {
            File("$absolutePath/cover-photo-${user.uuid}")
        }
    }

    /**
     * We optimistically update the UI for the images since they get processed in the background
     */
    fun saveProfile(context: Context, firstName: String, lastName: String, onComplete: (User?) -> Unit) {
        viewModelScope.launch(Dispatchers.IO) {
            isLoading.value = true
            val user = saveNameAsync(firstName, lastName).await()
            isLoading.value = false

            withContext(Dispatchers.Main) {
                onComplete(user)
            }
        }

        viewModelScope.launch(Dispatchers.IO) {
            val avatarJobDeferred = saveAvatarAsync(context)
            val coverPhotoJobDeferred = saveCoverPhotoAsync(context)

            val avatarJob = avatarJobDeferred.await()
            val coverPhotoJob = coverPhotoJobDeferred.await()

            if (avatarJob != null && coverPhotoJob != null) {
                WorkManager.getInstance(context).beginWith(avatarJob).then(coverPhotoJob).enqueue()
            } else if (avatarJob != null) {
                WorkManager.getInstance(context).beginWith(avatarJob).enqueue()
            } else if (coverPhotoJob != null) {
                WorkManager.getInstance(context).beginWith(coverPhotoJob).enqueue()
            } else {
                Timber.v("No photos to upload")
            }
        }
    }

    private fun saveNameAsync(firstName: String, lastName: String): Deferred<User?> {
        return viewModelScope.async(Dispatchers.IO) {
            val response = userRepository.patchName(ProfileDto(firstName, lastName))
            val body = response.body()

            isLoading.value = false

            body
        }
    }

    private fun saveAvatarAsync(context: Context): Deferred<OneTimeWorkRequest?> {
        return viewModelScope.async(Dispatchers.IO) {
            val bitmap = avatarPhoto.value ?: return@async null
            currentAvatarPhoto.value = bitmap
            // TODO: I need to find an image cropper that can guarantee a circular image
            val (width, height) = bitmap.findTargetWidthAndHeight(200, 200)
            val resizedBitmap = bitmap.scaleRespectingAspectRatio(width, height)

            val uploadUrlResponse = userRepository.getPreSignedUploadUrl(PhotoType.AVATAR)
            val preSignedUrl = uploadUrlResponse.body()?.preSignedUrl ?: return@async null

            val file = File(context.filesDir.absolutePath + "/" + UUID.randomUUID())
            file.writeBitmap(resizedBitmap, Bitmap.CompressFormat.PNG, 85)
            val data = workDataOf(
                FILE_URL to file.absolutePath,
                UPLOAD_URL to preSignedUrl,
                PHOTO_TYPE to PhotoType.AVATAR.value
            )

            OneTimeWorkRequestBuilder<UploadProfilePhotoWorker>().setInputData(data).build()
        }
    }

    private fun saveCoverPhotoAsync(context: Context): Deferred<OneTimeWorkRequest?> {
        return viewModelScope.async(Dispatchers.IO) {
            val bitmap = coverPhoto.value ?: return@async null
            currentCoverPhoto.value = bitmap
            val (width, height) = bitmap.findTargetWidthAndHeight(1000, 250)
            val resizedBitmap = bitmap.scaleRespectingAspectRatio(width, height)

            val uploadUrlResponse = userRepository.getPreSignedUploadUrl(PhotoType.COVER_PHOTO)
            val preSignedUrl = uploadUrlResponse.body()?.preSignedUrl ?: return@async null

            val file = File(context.filesDir.absolutePath + "/" + UUID.randomUUID())
            file.writeBitmap(resizedBitmap, Bitmap.CompressFormat.PNG, 85)

            val data = workDataOf(
                FILE_URL to file.absolutePath,
                UPLOAD_URL to preSignedUrl,
                PHOTO_TYPE to PhotoType.COVER_PHOTO.value
            )

            OneTimeWorkRequestBuilder<UploadProfilePhotoWorker>().setInputData(data).build()
        }
    }

    @Subscribe(threadMode = ThreadMode.MAIN)
    fun onSignedIn(event: SignInEvent) {
        val user = event.signInResponse.user
        // In case the user was signed in using a different account set these to null and re-fetch
        currentCoverPhoto.value = null
        currentAvatarPhoto.value = null

        // pre-fetch the current photos if possible
        viewModelScope.launch(Dispatchers.IO) {
            val coverPhoto = CoverPhoto(context, user)
            val avatar = Avatar(context, user)

            coverPhoto.getBitmap()?.let { bitmap -> currentCoverPhoto.value = bitmap }
            avatar.getBitmap()?.let { bitmap -> currentAvatarPhoto.value = bitmap }
        }
    }
}
