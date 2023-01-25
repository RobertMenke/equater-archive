package com.equater.equater.authentication

import android.annotation.SuppressLint
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Button
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Switch
import androidx.compose.material.SwitchDefaults
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.equater.equater.global.EnvironmentService
import com.equater.equater.navigation.Route
import com.equater.equater.ui.backgroundSecondary
import com.equater.equater.ui.frameFillWidth
import com.equater.equater.ui.textPrimaryColor
import com.google.accompanist.web.rememberWebViewState

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun PrivacyPolicy(navController: NavController, authViewModel: AuthenticationViewModel) {
    val state = rememberWebViewState(EnvironmentService.getWebUrl("/privacy?hideMobileMenu=true"))
    val backgroundColor = MaterialTheme.colors.background.value.toInt()
    val hasAgreed = remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
    ) {
        Text(text = "Privacy Policy", style = MaterialTheme.typography.h1)
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.fillMaxHeight(0.8f)
        ) {
            if (state.isLoading) {
                CircularProgressIndicator(color = textPrimaryColor(), strokeWidth = 1.dp)
            }

            com.google.accompanist.web.WebView(
                state = state,
                modifier = Modifier.fillMaxHeight(0.95f),
                captureBackPresses = false,
                onCreated = {
                    it.settings.javaScriptEnabled = true
                    it.setBackgroundColor(backgroundColor)
                }
            )
        }

        Column(
            verticalArrangement = Arrangement.Bottom,
            modifier = Modifier.height(150.dp)
        ) {
            Row(
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .frameFillWidth(60.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(backgroundSecondary())
                    .padding(vertical = 4.dp, horizontal = 4.dp)
            ) {
                Text(
                    text = "I have read & understood the privacy policy for Equater and our payment provider.",
                    style = MaterialTheme.typography.body1.copy(fontWeight = FontWeight.Bold, fontSize = 13.sp),
                    modifier = Modifier.fillMaxWidth(0.8f)
                )
                Switch(
                    modifier = Modifier.padding(horizontal = 8.dp),
                    checked = hasAgreed.value,
                    onCheckedChange = {
                        hasAgreed.value = it
                        authViewModel.setHasAcceptedPrivacyPolicy(it)
                    },
                    colors = SwitchDefaults.colors(
                        uncheckedThumbColor = textPrimaryColor()
                    )
                )
            }

            Button(
                onClick = {
                    if (!hasAgreed.value) {
                        return@Button
                    }

                    authViewModel.setHasAcceptedPrivacyPolicy(true)
                    navController.navigate(Route.CreateAgreement.route) {
                        popUpTo(navController.graph.startDestinationId)
                    }

                    if (authViewModel.shouldShowOnBoardingScreen()) {
                        authViewModel.showOnBoardingIntroQuestion.value = true
                    }

                    authViewModel.persistLegalDocAcceptance()
                },
                modifier = Modifier
                    .frameFillWidth(60.dp)
                    .padding(bottom = 8.dp, top = 2.dp)
            ) {
                Text(text = "Agree & Continue", style = MaterialTheme.typography.body1.copy(color = Color.White))
            }
        }
    }
}
