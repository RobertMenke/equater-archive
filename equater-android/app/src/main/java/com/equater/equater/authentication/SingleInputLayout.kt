package com.equater.equater.authentication

import android.content.Context
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material.Icon
import androidx.compose.material.IconButton
import androidx.compose.material.LinearProgressIndicator
import androidx.compose.material.Text
import androidx.compose.material.TextButton
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.equater.equater.ui.frameFillParent
import com.equater.equater.ui.frameFillWidth

@Composable
fun SingleInputLayout(
    onBackClicked: () -> Unit,
    onNextClicked: ((context: Context) -> Unit)? = null,
    isLoading: Boolean,
    nextButtonText: String = "Next",
    showNextButton: Boolean = true,
    children: @Composable () -> Unit
) {
    Column(modifier = frameFillParent.padding(horizontal = 16.dp)) {
        Column(
            modifier = Modifier.frameFillWidth(60.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                modifier = Modifier.frameFillWidth(60.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                IconButton(onClick = onBackClicked) {
                    Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                }

                if (showNextButton) {
                    val context = LocalContext.current
                    TextButton(onClick = {
                        if (onNextClicked != null) {
                            onNextClicked(context)
                        }
                    }, enabled = !isLoading) {
                        Text(text = nextButtonText)
                    }
                }
            }

            if (isLoading) {
                LinearProgressIndicator(modifier = Modifier.frameFillWidth(2.dp))
            }
        }

        children()
    }
}
