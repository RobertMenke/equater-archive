package com.equater.equater.components

import android.app.DatePickerDialog
import android.widget.DatePicker
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import java.time.LocalDateTime

@Composable fun makeDatePicker(
    default: LocalDateTime,
    onDateSelected: (DatePicker, Int, Int, Int) -> Unit,
    onDismiss: (() -> Unit)? = null
): DatePickerDialog {
    val context = LocalContext.current
    val year = default.year
    val month = default.monthValue - 1
    val day = default.dayOfMonth

    val picker = DatePickerDialog(context, onDateSelected, year, month, day)
    picker.setOnDismissListener {
        onDismiss?.invoke()
    }

    return picker
}
