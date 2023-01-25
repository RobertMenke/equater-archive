package com.equater.equater

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.res.painterResource
import androidx.navigation.NavController
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.authentication.User
import com.equater.equater.navigation.Route
import com.equater.equater.utils.onBoardingNavigation
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun SplashScreen(navController: NavController, authViewModel: AuthenticationViewModel) {
    var isRegularScale by remember { mutableStateOf(false) }
    val scale = animateFloatAsState(
        targetValue = if (isRegularScale) 1.0f else 0.5f,
        animationSpec = tween(500)
    )

    LaunchedEffect(true) {
        launch {
            var user: User? = null
            // Primarily for dev + testers
            if (authViewModel.environmentHasChanged()) {
                authViewModel.signOut()
            } else {
                user = authViewModel.findAuthenticatedUser()
                if (user != null) {
                    authViewModel.syncUserState()
                }
            }

            delay(700)

            if (user != null) {
                navController.onBoardingNavigation(authViewModel.getUserOnBoardingState(user))
            } else {
                navController.navigate(Route.WelcomeToEquater.route) {
                    popUpTo(navController.graph.startDestinationId)
                }
            }
        }
    }

    Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxHeight()) {
        Row(
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            Image(
                painter = painterResource(
                    id = if (isSystemInDarkTheme()) {
                        R.drawable.wallet_logo_no_background
                    } else {
                        R.drawable.wallet_logo_light_no_background
                    }
                ),
                contentDescription = "Logo",
                modifier = Modifier.scale(scale.value)
            )
        }
    }

    LaunchedEffect(true) {
        isRegularScale = true
    }
}
