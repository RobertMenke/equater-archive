package com.equater.equater.components

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import com.equater.equater.extensions.formatMonthDayYear
import com.equater.equater.ui.backgroundSecondary
import java.time.LocalDateTime

@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun DatePickerTextInput(
    date: LocalDateTime,
    onDateSelected: (LocalDateTime) -> Unit,
    modifier: Modifier = Modifier,
    onDismiss: (() -> Unit)? = null,
    backgroundColor: Color = backgroundSecondary()
) {
    val text = date.formatMonthDayYear()
    val focusRequester = remember { FocusRequester() }
    val focus = LocalFocusManager.current
    val datePicker = makeDatePicker(
        default = date,
        onDateSelected = { picker, year, month, day ->
            val nextDate = LocalDateTime.of(year, month + 1, day, 0, 0)
            onDateSelected(nextDate)
            focusRequester.freeFocus()
            focus.clearFocus(true)
        },
        onDismiss = {
            focusRequester.freeFocus()
            focus.clearFocus(true)
        }
    )

    PlainTextField(
        value = text,
        onValueChanged = {},
        modifier = modifier
            .fillMaxWidth()
            .onFocusChanged { focusState ->
                if (focusState.isFocused) {
                    datePicker.show()
                }
            },
        backgroundColor = backgroundColor,
        focusRequester = focusRequester
    )
}
