package com.equater.equater.extensions

import android.graphics.Bitmap
import java.lang.Double.min
import kotlin.math.abs

fun Bitmap.scaleRespectingAspectRatio(width: Int, height: Int, filter: Boolean = true): Bitmap {
    val horizontalRatio = width.toDouble() / this.width.toDouble()
    val verticalRatio = height.toDouble() / this.height.toDouble()
    val ratio = min(horizontalRatio, verticalRatio)
    val correctWidth = this.width * ratio
    val correctHeight = this.height * ratio

    return Bitmap.createScaledBitmap(this, correctWidth.toInt(), correctHeight.toInt(), filter)
}

data class ImageDimensions(val width: Int, val height: Int)

fun Bitmap.findTargetWidthAndHeight(desiredHeight: Int, desiredWidth: Int): ImageDimensions {
    val heightDifference = this.height - desiredHeight
    val widthDifference = this.width - desiredWidth

    return if (abs(heightDifference) < abs(widthDifference)) {
        ImageDimensions(this.height - desiredHeight, this.width - desiredHeight)
    } else {
        ImageDimensions(this.height - desiredWidth, this.width - desiredWidth)
    }
}
