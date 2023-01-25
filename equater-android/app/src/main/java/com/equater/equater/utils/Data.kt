package com.equater.equater.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import androidx.core.net.toUri
import arrow.core.continuations.nullable
import timber.log.Timber
import java.io.File
import java.io.IOException
import java.net.URL
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter

fun File.writeBitmap(bitmap: Bitmap, format: Bitmap.CompressFormat, quality: Int) {
    outputStream().use { out ->
        bitmap.compress(format, quality, out)
        out.flush()
    }
}

fun File.readBitmap(context: Context): Bitmap? {
    return try {
        context.openFileInput(this.name).use {
            BitmapFactory.decodeStream(it)
        }
    } catch (e: IOException) {
        Timber.v("Failed to read bitmap at uri ${toUri()}")
        Timber.d(e)
        null
    }
}

@Throws(IOException::class)
fun Uri.decodeBitmap(context: Context): Bitmap {
    return if (Build.VERSION.SDK_INT >= 28) {
        ImageDecoder.decodeBitmap(ImageDecoder.createSource(context.contentResolver, this))
    } else {
        val url = URL(this.toString())
        BitmapFactory.decodeStream(url.openConnection().getInputStream())
    }
}

fun LocalDateTime.toUTC(): LocalDateTime? {
    return atZone(ZoneId.systemDefault()).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime()
}

fun urlIsExpired(urlString: String): Boolean {
    val uri = Uri.parse(urlString)
    val isoDate = uri.getQueryParameter("X-Amz-Date")
    val expiration = uri.getQueryParameter("X-Amz-Expires")
    val zoneId = ZoneId.of("UTC")
    val localTime = LocalDateTime.now()
    val currentDate = localTime.toUTC()?.atZone(zoneId)

    val result = nullable.eager {
        val formatter = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").withZone(zoneId.bind())
        val date = ZonedDateTime.parse(isoDate.bind(), formatter)
        val expirationInSeconds = Integer.parseInt(expiration.bind())
        val expirationDate = date.plusSeconds(expirationInSeconds.bind().toLong())

        expirationDate.isBefore(currentDate.bind())
    }

    return result ?: true
}

inline fun <reified T : Enum<T>, V> ((T) -> V).find(value: V): T? {
    return enumValues<T>().firstOrNull { this(it) == value }
}
