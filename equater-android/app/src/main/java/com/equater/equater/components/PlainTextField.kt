package com.equater.equater.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.equater.equater.ui.backgroundPrimary
import com.equater.equater.ui.redDecline
import com.equater.equater.ui.textPrimaryColor

@Composable fun PlainTextField(
    value: String,
    onValueChanged: (String) -> Unit,
    modifier: Modifier = Modifier,
    isError: Boolean = false,
    backgroundColor: Color = backgroundPrimary(),
    width: Dp = 80.dp,
    height: Dp = 40.dp,
    interactionSource: MutableInteractionSource = remember { MutableInteractionSource() },
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default.copy(
        keyboardType = KeyboardType.Number
    ),
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    focusRequester: FocusRequester? = null
) {
    val textFieldModifier = modifier
        .width(width)
        .height(height)
        .clip(RoundedCornerShape(4.dp))
        .background(backgroundColor)
        .border(1.dp, if (isError) redDecline() else backgroundColor)

    var textModifier = Modifier.fillMaxWidth()
    if (focusRequester != null) {
        textModifier = textModifier.focusRequester(focusRequester)
    }

    Row(modifier = textFieldModifier, verticalAlignment = Alignment.CenterVertically) {
        BasicTextField(
            value = value,
            onValueChange = onValueChanged,
            modifier = textModifier.align(Alignment.CenterVertically),
            textStyle = MaterialTheme.typography.body1.copy(textAlign = TextAlign.Center),
            keyboardOptions = keyboardOptions,
            keyboardActions = keyboardActions,
            singleLine = true,
            cursorBrush = SolidColor(textPrimaryColor()),
            interactionSource = interactionSource
        )
    }
}
