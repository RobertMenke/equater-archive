package com.equater.equater.support

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.Divider
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.MaterialTheme
import androidx.compose.material.ModalBottomSheetLayout
import androidx.compose.material.ModalBottomSheetState
import androidx.compose.material.ModalBottomSheetValue
import androidx.compose.material.Text
import androidx.compose.material.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.equater.equater.components.BottomDrawerBody
import com.equater.equater.components.MenuItem
import com.equater.equater.ui.AppIcon
import com.equater.equater.ui.textSecondaryColor
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterialApi::class)
@Composable
fun SupportScreen() {
    val sheetState = rememberModalBottomSheetState(initialValue = ModalBottomSheetValue.Hidden)

    ModalBottomSheetLayout(
        sheetContent = { ActionSheet(sheetState) },
        content = { SupportBody(sheetState) },
        sheetState = sheetState
    )
}

@SuppressLint("QueryPermissionsNeeded")
@OptIn(ExperimentalMaterialApi::class)
@Composable
private fun SupportBody(sheetState: ModalBottomSheetState) {
    val emailLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) {
        println("$it")
    }
    val scope = rememberCoroutineScope()

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth(0.5f)
                    .padding(8.dp)
                    .clickable {
                        scope.launch {
                            sheetState.show()
                        }
                    },
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(text = "Call or Text", style = MaterialTheme.typography.h4, textAlign = TextAlign.Center)
                Text(
                    text = "(727) 437-2069",
                    style = MaterialTheme.typography.body1.copy(color = textSecondaryColor()),
                    textAlign = TextAlign.Center
                )
            }

            Divider(
                color = textSecondaryColor().copy(alpha = 0.5f),
                modifier = Modifier.fillMaxWidth(0.5f)
            )

            Column(
                modifier = Modifier
                    .fillMaxWidth(0.5f)
                    .padding(8.dp)
                    .clickable {
                        val intent = Intent(Intent.ACTION_SENDTO)
                        intent.data = Uri.parse("mailto:") // only email apps should handle this

                        intent.putExtra(Intent.EXTRA_EMAIL, arrayOf("support@equater.app"))
                        intent.putExtra(Intent.EXTRA_SUBJECT, "Equater Support Request")
                        intent.putExtra(
                            Intent.EXTRA_TEXT,
                            "Hey Equater Support Team, I'm having an issue with the app. Can you help?"
                        )

                        emailLauncher.launch(intent)
                    },
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(text = "Email", style = MaterialTheme.typography.h4, textAlign = TextAlign.Center)
                Text(
                    text = "support@equater.app",
                    style = MaterialTheme.typography.body1.copy(color = textSecondaryColor()),
                    textAlign = TextAlign.Center
                )
            }
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            contentAlignment = Alignment.BottomCenter
        ) {
            Text(
                text = "Our US-based support team typically responds within 24 hours",
                style = MaterialTheme.typography.h4,
                modifier = Modifier.padding(bottom = 80.dp),
                textAlign = TextAlign.Center
            )
        }
    }
}

@ExperimentalMaterialApi
@Composable
private fun ActionSheet(sheetState: ModalBottomSheetState) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val callLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) {
        println("$it")
    }
    val textLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) {
        println("$it")
    }

    fun callSupport() {
        val intent = Intent(Intent.ACTION_CALL)
        intent.data = Uri.parse("tel:+17274372069")
        callLauncher.launch(intent)
    }

    val callPermissionsLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
        onResult = {
            callSupport()
        }
    )

    BottomDrawerBody {
        MenuItem(icon = AppIcon.CallDialPad.painterResource(), text = "Call", action = {
            val intent = Intent(Intent.ACTION_CALL)
            intent.data = Uri.parse("tel:+17274372069")

            val callPermission = ContextCompat.checkSelfPermission(context, Manifest.permission.CALL_PHONE)
            val needsCallPermission = callPermission != PackageManager.PERMISSION_GRANTED

            if (needsCallPermission) {
                callPermissionsLauncher.launch(Manifest.permission.CALL_PHONE)
            } else {
                callSupport()
            }

            scope.launch { sheetState.hide() }
        })
        MenuItem(icon = AppIcon.Chat.painterResource(), text = "Text", action = {
            val intent = Intent(Intent.ACTION_VIEW)
            intent.data = Uri.parse("sms:+17274372069")
            intent.putExtra(
                "sms_body",
                "Hey Equater Support Team, I'm having an issue with the app. Can you help?"
            )
            textLauncher.launch(intent)
            scope.launch { sheetState.hide() }
        })
    }
}
