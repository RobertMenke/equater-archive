package com.equater.equater.authentication

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import coil.annotation.ExperimentalCoilApi
import coil.compose.rememberAsyncImagePainter
import com.equater.equater.R
import com.equater.equater.ui.frameFillParent

@ExperimentalCoilApi
@Composable
fun ResetPasswordConfirmation(navController: NavController, viewModel: AuthenticationViewModel = hiltViewModel()) {
    val context = LocalContext.current
    val email: String by viewModel.getEmail().collectAsState()
    val painter = rememberAsyncImagePainter(R.drawable.holding_phone)

    SingleInputLayout(
        onBackClicked = { navController.popBackStack() },
        showNextButton = false,
        isLoading = false
    ) {
        Column(
            modifier = frameFillParent,
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Image(painter = painter, contentDescription = "Reset Password Confirmation")

            Text(
                text = "Sent! Check your email.",
                style = MaterialTheme.typography.h3.copy(textAlign = TextAlign.Center)
            )

            Text(
                text = "We sent an email to ${email.trim()}. It contains instructions on resetting your password.",
                style = MaterialTheme.typography.body2.copy(textAlign = TextAlign.Center)
            )
        }
    }

    LaunchedEffect(true) {
        viewModel.resetPassword()
    }
}
