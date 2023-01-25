package com.equater.equater.ui

import android.content.Context
import android.content.Context.VIBRATOR_SERVICE
import android.os.Build
import android.os.VibrationEffect
import android.os.VibrationEffect.EFFECT_CLICK
import android.os.Vibrator
import android.os.VibratorManager

// https://developer.android.com/reference/android/os/VibrationEffect#createPredefined(int)
enum class Haptics(private val effect: Int) {
    TAP(if (Build.VERSION.SDK_INT >= 29) EFFECT_CLICK else 0);

    fun play(context: Context) {
        val vibrator = getVibratorService(context)
        if (Build.VERSION.SDK_INT >= 29) {
            val vibrationEffect = VibrationEffect.createPredefined(effect)
            vibrator.vibrate(vibrationEffect)
        } else {
            // Fallback to some sane default for older versions
            @Suppress("DEPRECATION")
            vibrator.vibrate(100)
        }
    }

    private fun getVibratorService(context: Context): Vibrator {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(VIBRATOR_SERVICE) as Vibrator
        }
    }
}
