package com.equater.equater.sharedExpenseCreation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.Button
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.equater.equater.ui.frameFillWidth

@Composable fun BillingWizardButton(
    prompt: String,
    buttonText: String,
    onClick: () -> Unit,
    isLoading: Boolean = false
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp)
            .padding(bottom = 20.dp),
        horizontalAlignment = Alignment.Start,
        verticalArrangement = Arrangement.Bottom
    ) {
        Text(text = prompt, style = MaterialTheme.typography.h4.copy(fontSize = 22.sp))
        Button(
            onClick = { if (!isLoading) onClick() },
            modifier = Modifier.frameFillWidth(60.dp).padding(top = 8.dp)
        ) {
            if (isLoading) {
                CircularProgressIndicator(color = Color.White, strokeWidth = 1.dp, modifier = Modifier.scale(0.8f))
            } else {
                Text(text = buttonText, style = MaterialTheme.typography.body1.copy(color = Color.White))
            }
        }
    }
}
