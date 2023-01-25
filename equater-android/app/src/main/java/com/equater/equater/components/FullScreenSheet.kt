package com.equater.equater.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

// Full screen sheet that will animate up from the bottom of the view
@Composable
fun FullScreenSheet(
    isShowing: Boolean,
    content: @Composable () -> Unit,
    modifier: Modifier = Modifier
) {
    AnimatedVisibility(
        visible = isShowing,
        enter = slideInVertically { it },
        exit = slideOutVertically { it }
    ) {
        Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colors.background) {
            Column(modifier = Modifier.fillMaxSize()) {
                content()
            }
        }
    }
}
