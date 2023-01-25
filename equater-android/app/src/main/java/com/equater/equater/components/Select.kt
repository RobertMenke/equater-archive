package com.equater.equater.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Icon
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.equater.equater.ui.backgroundSecondary
import com.equater.equater.ui.textPrimaryColor

@Composable
fun Select(
    text: String,
    onClick: () -> Unit,
    backgroundColor: Color = backgroundSecondary(),
    width: Dp = 120.dp,
    height: Dp = 40.dp
) {
    Box(
        modifier = Modifier
            .width(width)
            .height(height)
            .clip(RoundedCornerShape(4.dp))
            .background(backgroundColor)
            .clickable { onClick() }
    ) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text(text = text, style = MaterialTheme.typography.body1)
        }

        Box(modifier = Modifier.fillMaxSize().padding(end = 8.dp), contentAlignment = Alignment.CenterEnd) {
            Icon(
                imageVector = Icons.Filled.ArrowDropDown,
                contentDescription = "Drop down arrow",
                tint = textPrimaryColor()
            )
        }
    }
}
