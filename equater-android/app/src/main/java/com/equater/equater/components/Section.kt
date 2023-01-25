package com.equater.equater.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable fun Section(title: String, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Column(modifier = Modifier.padding(top = 4.dp, bottom = 8.dp)) {
        Text(text = title, style = MaterialTheme.typography.h3, modifier = Modifier.padding(bottom = 8.dp))
        content()
    }
}
