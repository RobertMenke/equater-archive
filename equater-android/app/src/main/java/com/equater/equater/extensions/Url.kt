package com.equater.equater.extensions

import android.content.Context
import android.graphics.Bitmap
import android.graphics.drawable.BitmapDrawable
import android.net.Uri
import coil.imageLoader
import coil.request.ImageRequest

suspend fun Uri.downloadBitmap(context: Context): Bitmap? {
    val loader = context.imageLoader
    val request = ImageRequest.Builder(context)
        .data(this)
        .allowHardware(false)
        .build()

    val drawable = loader.execute(request).drawable as? BitmapDrawable
    return drawable?.bitmap
}
