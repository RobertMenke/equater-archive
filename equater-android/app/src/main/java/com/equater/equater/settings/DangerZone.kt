package com.equater.equater.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.AlertDialog
import androidx.compose.material.Button
import androidx.compose.material.ButtonDefaults
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.equater.equater.R
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.ui.backgroundSecondary
import com.equater.equater.ui.redDecline

@Composable
fun DangerZone(navController: NavController, authViewModel: AuthenticationViewModel) {
    val context = LocalContext.current
    val authenticatedUser by authViewModel.authenticatedUser.collectAsState()
    val user = authenticatedUser ?: return
    var isLoading by remember { mutableStateOf(false) }
    var showAlert by remember { mutableStateOf(false) }

    if (showAlert) {
        AlertDialog(
            title = { Text("Are you sure?") },
            text = {
                Text(text = context.getString(R.string.deletion_description))
            },
            buttons = {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(60.dp)
                        .background(backgroundSecondary()),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Button(
                        onClick = { showAlert = false },
                        modifier = Modifier
                            .weight(0.5f)
                            .fillMaxHeight(),
                        colors = ButtonDefaults.buttonColors(backgroundColor = backgroundSecondary())
                    ) {
                        Text("Cancel")
                    }
                    Button(
                        onClick = {
                            showAlert = false
                            isLoading = true
                            authViewModel.permanentlyDeleteAccount(user)
                        },
                        modifier = Modifier
                            .weight(0.5f)
                            .fillMaxHeight(),
                        colors = ButtonDefaults.buttonColors(backgroundColor = backgroundSecondary())
                    ) {
                        Text("Delete Account")
                    }
                }
            },
            onDismissRequest = {
                showAlert = false
            }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(14.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            "Permanently Delete Your Account",
            style = MaterialTheme.typography.body1.copy(fontSize = 22.sp, fontWeight = FontWeight.Bold),
            modifier = Modifier.padding(bottom = 4.dp)
        )
        Text(
            text = context.getString(R.string.deletion_confirmation_description),
            style = MaterialTheme.typography.body2.copy(fontSize = 15.sp),
            modifier = Modifier.padding(bottom = 16.dp)
        )

        Button(
            onClick = {
                if (!isLoading) {
                    showAlert = true
                }
            },
            modifier = Modifier
                .padding(bottom = 20.dp)
                .fillMaxWidth(),
            contentPadding = PaddingValues(vertical = 18.dp),
            colors = ButtonDefaults.buttonColors(backgroundColor = redDecline())
        ) {
            if (isLoading) {
                CircularProgressIndicator(color = Color.White, strokeWidth = 1.dp, modifier = Modifier.scale(0.8f))
            } else {
                Text("Permanently Delete Account", style = MaterialTheme.typography.body1)
            }
        }
    }
}
