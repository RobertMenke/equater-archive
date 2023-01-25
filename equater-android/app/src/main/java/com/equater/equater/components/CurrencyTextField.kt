package com.equater.equater.components

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.unit.dp

@Composable
fun CurrencyTextField(
    value: String,
    onValueChanged: (String) -> Unit,
    isError: Boolean,
    focusRequester: FocusRequester? = null
) {
    Row(
        modifier = Modifier
            .fillMaxHeight()
            .width(76.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = "$", style = MaterialTheme.typography.body1, modifier = Modifier.padding(end = 2.dp))
        PlainTextField(
            width = 66.dp,
            value = value,
            onValueChanged = onValueChanged,
            isError = isError,
            focusRequester = focusRequester
        )
    }
}
