package com.equater.equater.extensions

import android.content.Context
import android.content.ContextWrapper
import android.graphics.Bitmap
import android.os.storage.StorageManager
import androidx.appcompat.app.AppCompatActivity
import timber.log.Timber

fun Context.canStore(bitmap: Bitmap): Boolean {
    val storageManager = this.getSystemService(StorageManager::class.java)

    if (storageManager == null) {
        Timber.d("StorageManager is null inside of Context.canStore. Content was not written to disk.")
        return false
    }

    val appSpecificInternalDirUuid = storageManager.getUuidForPath(filesDir)
    val availableBytes = storageManager.getAllocatableBytes(appSpecificInternalDirUuid)

    return availableBytes >= bitmap.byteCount
//    if (availableBytes >= bitmap.byteCount) {
//        return true
//        storageManager.allocateBytes(appSpecificInternalDirUuid, NUM_BYTES_NEEDED_FOR_MY_APP)
//    } else {
//        val storageIntent = Intent().apply {
//            // To request that the user remove all app cache files instead, set
//            // "action" to ACTION_CLEAR_APP_CACHE.
//            action = ACTION_MANAGE_STORAGE
//        }
//
//        return false
//    }
}

fun Context.getActivity(): AppCompatActivity? = when (this) {
    is AppCompatActivity -> this
    is ContextWrapper -> baseContext.getActivity()
    else -> null
}
