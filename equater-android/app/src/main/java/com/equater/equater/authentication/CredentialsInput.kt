package com.equater.equater.authentication

import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.material.Button
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.material.TextButton
import androidx.compose.material.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.navigation.NavController
import com.equater.equater.MIN_CHARACTERS_IN_PASSWORD
import com.equater.equater.global.EnvironmentService
import com.equater.equater.navigation.Route
import com.equater.equater.ui.emailKeyboard
import com.equater.equater.ui.frameFillParent
import com.equater.equater.ui.frameFillWidth
import com.equater.equater.ui.passwordKeyboard
import com.equater.equater.ui.textSecondaryColor
import com.equater.equater.utils.onBoardingNavigation
import org.apache.commons.validator.routines.EmailValidator

@Composable
fun SignIn(navController: NavController, authViewModel: AuthenticationViewModel) {
    val context = LocalContext.current
    val handleSignIn = {
        signIn(context, authViewModel) { user ->
            navController.onBoardingNavigation(authViewModel.getUserOnBoardingState(user))
        }
    }

    val isLoading by authViewModel.getIsLoading().collectAsState()

    CredentialsInput(navController = navController, authViewModel = authViewModel, onSubmit = handleSignIn) {
        Column(modifier = Modifier.padding(top = 8.dp)) {
            TextButton(
                onClick = {
                    navController.navigate(Route.ResetPassword.route)
                },
                modifier = Modifier.offset(x = (-6).dp)
            ) {
                Text(
                    text = "Reset Password",
                    style = MaterialTheme.typography.body1.copy(fontSize = 3.5.em)
                        .merge(TextStyle(textDecoration = TextDecoration.Underline))
                )
            }

            Button(
                onClick = {
                    if (!isLoading) {
                        handleSignIn()
                    }
                },
                modifier = Modifier
                    .padding(top = 8.dp)
                    .frameFillWidth(52.dp)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White, strokeWidth = 1.dp, modifier = Modifier.scale(0.8f))
                } else {
                    Text(
                        text = "Sign In",
                        style = MaterialTheme.typography.body1.copy(fontSize = 3.5.em, color = Color.White)
                    )
                }
            }
        }
    }
}

@Composable fun Registration(navController: NavController, authViewModel: AuthenticationViewModel) {
    val context = LocalContext.current
    val handleRegistration = {
        register(context, authViewModel) { user ->
            navController.onBoardingNavigation(authViewModel.getUserOnBoardingState(user))
        }
    }
    val isLoading by authViewModel.getIsLoading().collectAsState()

    CredentialsInput(navController = navController, authViewModel = authViewModel, onSubmit = handleRegistration) {
        Column(modifier = Modifier.padding(top = 8.dp)) {
            Text(
                "We’ll send you a quick email to confirm your address.",
                modifier = Modifier.padding(top = 16.dp),
                style = MaterialTheme.typography.body2
            )

            Button(
                onClick = { if (!isLoading) handleRegistration() },
                modifier = Modifier
                    .padding(top = 8.dp)
                    .frameFillWidth(52.dp)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White, strokeWidth = 1.dp, modifier = Modifier.scale(0.8f))
                } else {
                    Text(
                        text = "Sign Up",
                        style = MaterialTheme.typography.body1.copy(fontSize = 3.5.em, color = Color.White)
                    )
                }
            }
        }
    }
}

@Composable private fun CredentialsInput(
    navController: NavController,
    authViewModel: AuthenticationViewModel,
    onSubmit: () -> Unit,
    helperContent: @Composable () -> Unit
) {
    val isLoading by authViewModel.getIsLoading().collectAsState()
    val emailFocusRequester = remember { FocusRequester() }
    val passwordFocusRequester = remember { FocusRequester() }

    SingleInputLayout(
        onBackClicked = { navController.popBackStack() },
        onNextClicked = { onSubmit() },
        isLoading = isLoading
    ) {
        Column(modifier = frameFillParent.padding(horizontal = 8.dp, vertical = 2.dp)) {
            Column {
                Row(
                    modifier = Modifier
                        .frameFillWidth(30.dp)
                        .padding(bottom = 6.dp),
                    verticalAlignment = Alignment.Bottom
                ) {
                    Text(
                        text = "Email",
                        style = MaterialTheme.typography.body1.copy(fontSize = 4.em, fontWeight = FontWeight.Bold)
                    )
                }

                Row(modifier = Modifier.frameFillWidth(60.dp), verticalAlignment = Alignment.CenterVertically) {
                    EmailTextField(
                        authViewModel = authViewModel,
                        emailFocusRequester = emailFocusRequester,
                        passwordFocusRequester = passwordFocusRequester
                    )
                }
            }

            Column(modifier = Modifier.padding(top = 12.dp)) {
                Row(
                    modifier = Modifier
                        .frameFillWidth(30.dp)
                        .padding(bottom = 6.dp),
                    verticalAlignment = Alignment.Bottom
                ) {
                    Text(
                        text = "Password",
                        style = MaterialTheme.typography.body1.copy(fontSize = 4.em, fontWeight = FontWeight.Bold)
                    )
                }
                Row(modifier = Modifier.frameFillWidth(60.dp), verticalAlignment = Alignment.CenterVertically) {
                    PasswordTextField(
                        authViewModel = authViewModel,
                        passwordFocusRequester = passwordFocusRequester,
                        onSubmit = onSubmit
                    )
                }
            }

            helperContent()

            LaunchedEffect(true) {
                emailFocusRequester.requestFocus()
            }
        }
    }
}

@Composable private fun EmailTextField(
    authViewModel: AuthenticationViewModel,
    emailFocusRequester: FocusRequester,
    passwordFocusRequester: FocusRequester
) {
    val email: String by authViewModel.getEmail().collectAsState()

    TextField(
        value = email,
        onValueChange = authViewModel::setEmail,
        label = { Text(text = "What's your email address?") },
        placeholder = { Text(text = "jane.doe@gmail.com", color = textSecondaryColor().copy(alpha = 0.8f)) },
        keyboardOptions = emailKeyboard(),
        modifier = Modifier
            .frameFillWidth(60.dp)
            .focusRequester(emailFocusRequester),
        keyboardActions = KeyboardActions(onNext = {
            passwordFocusRequester.requestFocus()
        })
    )
}

@Composable private fun PasswordTextField(
    authViewModel: AuthenticationViewModel,
    passwordFocusRequester: FocusRequester,
    onSubmit: () -> Unit
) {
    val focusManager = LocalFocusManager.current
    val password: String by authViewModel.getPassword().collectAsState()

    TextField(
        value = password,
        onValueChange = authViewModel::setPassword,
        label = { Text(text = "What's your password?") },
        placeholder = {
            Text(
                text = "Enter $MIN_CHARACTERS_IN_PASSWORD or more characters",
                color = textSecondaryColor().copy(alpha = 0.8f)
            )
        },
        visualTransformation = PasswordVisualTransformation(),
        keyboardOptions = passwordKeyboard(),
        modifier = Modifier
            .frameFillWidth(60.dp)
            .focusRequester(passwordFocusRequester)
            .navigationBarsPadding()
            .imePadding(),
        keyboardActions = KeyboardActions(onGo = {
            onSubmit()
            focusManager.clearFocus(true)
        })
    )
}

private fun signIn(context: Context, authViewModel: AuthenticationViewModel, onSuccess: (User) -> Unit) {
    if (!EmailValidator.getInstance().isValid(authViewModel.getEmail().value.trim())) {
        Toast.makeText(context, "Please enter a valid email address", Toast.LENGTH_LONG).show()
        return
    }

    if (authViewModel.getPassword().value.length < 8) {
        Toast.makeText(context, "Must be 8 or more characters", Toast.LENGTH_LONG).show()
        return
    }

    authViewModel.setIsLoading(true)
    authViewModel.signInAsync { user ->
        authViewModel.setIsLoading(false)

        if (user == null) {
            Toast.makeText(context, "Email or password is incorrect", Toast.LENGTH_LONG).show()
        } else {
            onSuccess(user)
        }
    }
}

private fun register(context: Context, authViewModel: AuthenticationViewModel, onSuccess: (User) -> Unit) {
    if (authViewModel.getPassword().value.length < MIN_CHARACTERS_IN_PASSWORD) {
        Toast
            .makeText(
                context,
                "Must be $MIN_CHARACTERS_IN_PASSWORD or more characters",
                Toast.LENGTH_LONG
            )
            .show()
        return
    }

    authViewModel.setIsLoading(true)
    authViewModel.registerAsync { response ->
        authViewModel.setIsLoading(false)
        val user = response?.body()?.user

        when {
            user != null -> {
                Toast.makeText(context, "We sent you an email to verify your address", Toast.LENGTH_LONG).show()
                onSuccess(user)
            }
            response?.code() == 400 -> {
                Toast.makeText(context, "User already exists. Try signing in.", Toast.LENGTH_LONG).show()
            }
            else -> {
                Toast.makeText(
                    context,
                    "Unable to complete sign up. Call ${EnvironmentService.getSupportPhoneNumber()}.",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }
}
