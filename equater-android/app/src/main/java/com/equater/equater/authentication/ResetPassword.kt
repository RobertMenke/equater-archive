package com.equater.equater.authentication

import android.widget.Toast
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.material.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.equater.equater.navigation.Route
import com.equater.equater.ui.emailKeyboard
import com.equater.equater.ui.frameFillWidth
import com.equater.equater.ui.textSecondaryColor
import org.apache.commons.validator.routines.EmailValidator

@Composable
fun ResetPassword(navController: NavController, viewModel: AuthenticationViewModel = hiltViewModel()) {
    val text: String by viewModel.getEmail().collectAsState()
    val focusRequester = remember { FocusRequester() }
    val context = LocalContext.current
    val submit: () -> Unit = {
        if (EmailValidator.getInstance().isValid(text.trim())) {
            navController.navigate(Route.ResetPasswordConfirmation.route)
        } else {
            Toast.makeText(context, "Please enter a valid email address", Toast.LENGTH_LONG).show()
        }
    }

    SingleInputLayout(
        onBackClicked = { navController.popBackStack() },
        onNextClicked = { submit() },
        isLoading = false
    ) {
        Column(modifier = Modifier.padding(vertical = 32.dp)) {
            Column {
                Row(
                    modifier = Modifier
                        .frameFillWidth(60.dp)
                        .padding(bottom = 6.dp),
                    verticalAlignment = Alignment.Bottom
                ) {
                    Text(
                        text = "Email",
                        style = MaterialTheme.typography.body1.copy(fontSize = 4.em, fontWeight = FontWeight.Bold)
                    )
                }

                Row(modifier = Modifier.frameFillWidth(60.dp), verticalAlignment = Alignment.CenterVertically) {
                    TextField(
                        value = text,
                        onValueChange = viewModel::setEmail,
                        label = { Text(text = "What's your email address?") },
                        placeholder = {
                            Text(
                                text = "jane.doe@gmail.com",
                                color = textSecondaryColor().copy(alpha = 0.8f)
                            )
                        },
                        keyboardOptions = emailKeyboard(),
                        modifier = Modifier
                            .frameFillWidth(60.dp)
                            .focusRequester(focusRequester),
                        // backgroundColor = MaterialTheme.colors.background,
                        keyboardActions = KeyboardActions(onGo = {
                            submit()
                        })
                    )
                }
            }

            Row(modifier = Modifier.frameFillWidth(32.dp)) {
                Text(
                    text = "Enter the email you signed up with to reset your password.",
                    style = MaterialTheme.typography.body2.copy(fontSize = 11.sp),
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            Spacer(modifier = Modifier.frameFillWidth(200.dp))

            LaunchedEffect(true) {
                focusRequester.requestFocus()
            }
        }
    }
}
