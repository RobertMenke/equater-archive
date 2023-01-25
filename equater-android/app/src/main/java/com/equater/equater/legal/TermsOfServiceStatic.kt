package com.equater.equater.legal

import android.annotation.SuppressLint
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.equater.equater.global.EnvironmentService
import com.equater.equater.ui.textPrimaryColor
import com.google.accompanist.web.WebView
import com.google.accompanist.web.rememberWebViewState

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun TermsOfServiceStatic() {
    val state = rememberWebViewState(EnvironmentService.getWebUrl("/terms?hideMobileMenu=true"))
    val backgroundColor = MaterialTheme.colors.background.value.toInt()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.fillMaxHeight()
        ) {
            if (state.isLoading) {
                CircularProgressIndicator(color = textPrimaryColor(), strokeWidth = 1.dp)
            }

            WebView(
                state = state,
                modifier = Modifier.fillMaxHeight(),
                captureBackPresses = false,
                onCreated = {
                    it.settings.javaScriptEnabled = true
                    it.setBackgroundColor(backgroundColor)
                }
            )
        }
    }
}
