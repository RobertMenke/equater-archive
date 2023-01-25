package com.equater.equater.authentication

import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.Button
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Surface
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.equater.equater.R
import com.equater.equater.ui.AppIcon
import kotlinx.coroutines.launch
import timber.log.Timber

@Composable
fun EmailConfirmationDialog(authenticationViewModel: AuthenticationViewModel, onDismiss: () -> Unit) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var isLoading by remember { mutableStateOf(false) }
    val buttonContentPadding = if (isLoading) {
        PaddingValues(horizontal = 94.dp, vertical = 4.dp)
    } else {
        PaddingValues(horizontal = 16.dp, vertical = 12.dp)
    }

    fun resendConfirmation() {
        isLoading = true
        scope.launch {
            try {
                val response = authenticationViewModel.resendEmailConfirmationAsync().await()
                isLoading = false
                if (response.isSuccessful) {
                    onDismiss()
                    Toast.makeText(context, "Sent! Check your email inbox.", Toast.LENGTH_LONG).show()
                } else {
                    Timber.e(
                        "Error sending email confirmation -- ${response.code()} -- ${response.errorBody()}"
                    )
                    Toast.makeText(context, "Unable to resend email confirmation", Toast.LENGTH_LONG)
                        .show()
                }
            } catch (e: Throwable) {
                isLoading = false
                Timber.e(e)
                Toast.makeText(context, "Unable to resend email confirmation", Toast.LENGTH_LONG).show()
            }
        }
    }

    Dialog(onDismissRequest = onDismiss) {
        Surface(color = MaterialTheme.colors.background) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .defaultMinSize(minHeight = 400.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Image(
                    painter = AppIcon.Mailbox.painterResource(),
                    contentDescription = "Mailbox",
                    modifier = Modifier.size(100.dp).padding(vertical = 12.dp)
                )

                Text(text = "Check your email", style = MaterialTheme.typography.h2, textAlign = TextAlign.Center)

                Text(
                    text = context.getString(R.string.email_verification_description),
                    style = MaterialTheme.typography.body1,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )

                Button(
                    contentPadding = buttonContentPadding,
                    modifier = Modifier.padding(vertical = 16.dp),
                    onClick = { if (!isLoading) resendConfirmation() }
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            color = Color.White,
                            strokeWidth = 1.dp,
                            modifier = Modifier.scale(0.8f)
                        )
                    } else {
                        Text(
                            text = "Resend Email Verification",
                            style = MaterialTheme.typography.body1.copy(
                                color = Color.White,
                                fontWeight = FontWeight.Bold
                            )
                        )
                    }
                }
            }
        }
    }
}
