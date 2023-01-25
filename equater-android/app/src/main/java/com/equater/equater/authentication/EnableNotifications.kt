package com.equater.equater.authentication

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.Button
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.material.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.core.content.ContextCompat
import com.equater.equater.R
import com.equater.equater.ui.frameFillWidth
import timber.log.Timber

@Composable fun EnableNotifications(authViewModel: AuthenticationViewModel, onComplete: () -> Unit) {
    val context = LocalContext.current

    val notificationPermissionsLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
        onResult = { permissionGranted ->
            if (!permissionGranted) {
                Toast.makeText(
                    context,
                    "Equater will not be able to send you push notifications",
                    Toast.LENGTH_SHORT
                ).show()
            } else {
                authViewModel.handleNotificationPermissionGranted()
            }

            onComplete()
        }
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            Image(
                painter = painterResource(
                    id = if (isSystemInDarkTheme()) {
                        R.drawable.bell_notification_dark_mode
                    } else {
                        R.drawable.bell_notification_light_mode
                    }
                ),
                contentDescription = "Bell Icon"
            )
        }

        Text(
            text = "Enable Notifications",
            style = MaterialTheme.typography.h3.copy(textAlign = TextAlign.Center)
        )

        Text(
            text = "We’d like to send you push notifications related to your expenses",
            style = MaterialTheme.typography.body2.copy(textAlign = TextAlign.Center)
        )

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Button(
                onClick = {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        val notificationPermission =
                            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
                        val hasNotificationPermission = notificationPermission == PackageManager.PERMISSION_GRANTED

                        if (!hasNotificationPermission) {
                            notificationPermissionsLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                        } else {
                            onComplete()
                        }
                    } else {
                        Timber.w("User was presented with notification screen with SDK_INT < 33")
                        onComplete()
                    }
                },
                modifier = Modifier
                    .padding(top = 16.dp)
                    .frameFillWidth(60.dp)
            ) {
                Text(
                    text = "Enable Notifications",
                    style = MaterialTheme.typography.body1.copy(fontSize = 3.5.em, color = Color.White)
                )
            }

            TextButton(
                onClick = {
                    Toast.makeText(
                        context,
                        "Equater will not be able to send you push notifications",
                        Toast.LENGTH_SHORT
                    ).show()
                    onComplete()
                },
                modifier = Modifier
                    .padding(top = 16.dp)
                    .width(200.dp)
                    .height(60.dp)
            ) {
                Text(
                    text = "No thanks",
                    style = MaterialTheme.typography.body1.copy(fontSize = 3.5.em)
                )
            }
        }
    }
}
