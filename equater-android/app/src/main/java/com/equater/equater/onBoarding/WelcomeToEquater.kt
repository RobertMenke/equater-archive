package com.equater.equater.onBoarding

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.absoluteOffset
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.Button
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.material.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.airbnb.lottie.LottieProperty
import com.airbnb.lottie.compose.LottieAnimation
import com.airbnb.lottie.compose.LottieCompositionSpec
import com.airbnb.lottie.compose.LottieConstants
import com.airbnb.lottie.compose.animateLottieCompositionAsState
import com.airbnb.lottie.compose.rememberLottieComposition
import com.airbnb.lottie.compose.rememberLottieDynamicProperties
import com.airbnb.lottie.compose.rememberLottieDynamicProperty
import com.equater.equater.R
import com.equater.equater.navigation.Route
import com.equater.equater.previews.PreviewWrapper
import com.equater.equater.ui.frameFillParent
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun WelcomeToEquater(navController: NavController) {
    var isRegularScale by remember { mutableStateOf(false) }
    val lottieScale = animateFloatAsState(
        targetValue = if (isRegularScale) 1.0f else 0.9f,
        animationSpec = tween(800, 50)
    )
    var titleVisible by remember { mutableStateOf(false) }
    var subTitleVisible by remember { mutableStateOf(false) }
    var buttonsVisible by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    LaunchedEffect(true) {
        scope.launch {
            isRegularScale = true
        }

        scope.launch {
            delay(50)
            titleVisible = true
        }

        scope.launch {
            delay(200)
            subTitleVisible = true
        }

        scope.launch {
            delay(350)
            buttonsVisible = true
        }
    }

    Column(
        modifier = frameFillParent.padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        LevitatingFinanceMan(modifier = Modifier.scale(lottieScale.value))

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.absoluteOffset(y = (-24).dp)
        ) {
            Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                AnimatedVisibility(
                    visible = titleVisible,
                    enter = fadeIn(tween(500)),
                    exit = fadeOut(tween(500))
                ) {
                    Text(
                        text = "Split recurring bills automatically",
                        style = MaterialTheme.typography.h3.copy(fontSize = 32.sp),
                        textAlign = TextAlign.Center,
                        fontWeight = FontWeight.ExtraBold
                    )
                }

                AnimatedVisibility(
                    visible = subTitleVisible,
                    enter = fadeIn(tween(500)),
                    exit = fadeOut(tween(500))
                ) {
                    Text(
                        text = context.getString(R.string.welcome_screen_description),
                        style = MaterialTheme.typography.body2,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }

            AnimatedVisibility(
                visible = buttonsVisible,
                enter = fadeIn(tween(500)),
                exit = fadeOut(tween(500))
            ) {
                Column {
                    Button(
                        onClick = {
                            navController.navigate(Route.Registration.route)
                        },
                        modifier = Modifier
                            .padding(top = 32.dp)
                            .width(200.dp)
                            .height(60.dp)
                    ) {
                        Text(
                            text = "Get Started",
                            style = MaterialTheme.typography.body1.copy(fontSize = 3.5.em, color = Color.White)
                        )
                    }

                    TextButton(
                        onClick = {
                            navController.navigate(Route.SignIn.route)
                        },
                        modifier = Modifier
                            .padding(top = 16.dp)
                            .width(200.dp)
                            .height(60.dp)
                    ) {
                        Text(
                            text = "Sign In",
                            style = MaterialTheme.typography.body1.copy(fontSize = 3.5.em)
                        )
                    }
                }
            }
        }
    }
}

// http://airbnb.io/lottie/#/android-compose
@Composable
fun LevitatingFinanceMan(modifier: Modifier = Modifier) {
    val composition by rememberLottieComposition(spec = LottieCompositionSpec.RawRes(R.raw.levitating_finances))
    val progress by animateLottieCompositionAsState(
        composition = composition,
        iterations = LottieConstants.IterateForever
    )
    // TODO: Update the lottie file so that the colors are correct :(
    val dynamicProperties = rememberLottieDynamicProperties(
        rememberLottieDynamicProperty(
            property = LottieProperty.COLOR,
            value = android.graphics.Color.argb(1, 122, 4, 235),
            keyPath = arrayOf("Tronco", "Group 4", "Group 2", "Fill 1")
        ),
        rememberLottieDynamicProperty(
            property = LottieProperty.COLOR,
            value = android.graphics.Color.argb(1, 122, 4, 235),
            keyPath = arrayOf("Brazo derecho", "Group 2", "Group 2", "Fill 1")
        ),
        rememberLottieDynamicProperty(
            property = LottieProperty.COLOR,
            value = android.graphics.Color.argb(1, 122, 4, 235),
            keyPath = arrayOf("Brazo izquierdo", "Group 2", "Group 2", "Fill 1")
        )
    )

    LottieAnimation(
        composition = composition,
        progress = progress,
        dynamicProperties = dynamicProperties,
        modifier = modifier.fillMaxHeight(0.5f)
    )
}

@Preview
@Composable
private fun Preview() {
    PreviewWrapper { navController ->
        WelcomeToEquater(navController)
    }
}
