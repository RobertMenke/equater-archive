package com.equater.equater.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Surface
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.unit.dp
import com.equater.equater.ui.EquaterTheme
import com.equater.equater.ui.frameFillWidth

@Composable
fun BottomDrawerBody(children: @Composable () -> Unit) {
    EquaterTheme {
        Surface(color = MaterialTheme.colors.background) {
            Column(modifier = Modifier.padding(bottom = 8.dp, top = 8.dp)) {
                children()
            }
        }
    }
}

// When the sheet content for a ModalBottomSheetLayout is empty the runtime will throw
// java.lang.IllegalArgumentException: The initial value must have an associated anchor.
// In order to avoid this, we can return an empty bottom drawer
@Composable
fun EmptyBottomDrawer() {
    Box(modifier = Modifier.defaultMinSize(minHeight = 1.dp)) {
        // No content needed
    }
}

@Composable
fun MenuItem(icon: Painter, text: String, action: () -> Unit) {
    Row(
        modifier = Modifier
            .frameFillWidth(60.dp)
            .clickable(onClick = action),
        verticalAlignment = Alignment.CenterVertically
    ) {
        ColorIcon(
            asset = icon,
            modifier = Modifier.padding(start = 16.dp, end = 16.dp)
        )
        Text(text)
    }
}
