package com.equater.equater.onBoarding

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.Button
import androidx.compose.material.LocalContentAlpha
import androidx.compose.material.LocalContentColor
import androidx.compose.material.MaterialTheme
import androidx.compose.material.OutlinedTextField
import androidx.compose.material.Text
import androidx.compose.material.TextButton
import androidx.compose.material.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.navigation.NavController
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.authentication.OnBoardingFeedback
import com.equater.equater.components.RadioButtonCard
import com.equater.equater.navigation.NAV_ANIMATION_DURATION
import com.equater.equater.navigation.Route
import com.equater.equater.ui.backgroundSecondary
import com.equater.equater.ui.textPrimaryColor
import com.equater.equater.ui.textSecondaryColor
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import nl.dionsegijn.konfetti.compose.KonfettiView
import nl.dionsegijn.konfetti.core.Party
import nl.dionsegijn.konfetti.core.Position
import nl.dionsegijn.konfetti.core.emitter.Emitter
import java.util.concurrent.TimeUnit

enum class OnBoardingOption(val id: Int) {
    None(0),
    SplitBills(1),
    SplitSubscriptions(2),
    ChargingTenants(3),
    SomethingElse(4);

    fun getText(): String {
        return when (this) {
            SplitBills -> "Splitting bills with roommate(s)"
            SplitSubscriptions -> "Splitting subscriptions with friends"
            ChargingTenants -> "Charging tenants for rent"
            SomethingElse -> "Something else"
            None -> ""
        }
    }

    fun serialize(): OnBoardingFeedback? {
        return when (this) {
            None -> null
            SplitBills -> OnBoardingFeedback("splitBills")
            SplitSubscriptions -> OnBoardingFeedback("splitSubscriptions")
            ChargingTenants -> OnBoardingFeedback("chargingTenants")
            SomethingElse -> OnBoardingFeedback("somethingElse")
        }
    }
}

// Not the best practice to have this lingering outside of a composable,
// but I need a coroutine scope that will survive the end of this composition
// so that I can navigate smoothly after the view has been closed
private val mainScope = CoroutineScope(Job() + Dispatchers.Main)

@Composable
fun OnBoarding(authenticationViewModel: AuthenticationViewModel, navController: NavController) {
    var showOptions by remember { mutableStateOf(true) }
    var showTellUsMore by remember { mutableStateOf(false) }

    AnimatedVisibility(
        visible = showOptions,
        exit = slideOutHorizontally(
            animationSpec = tween(durationMillis = 300, easing = FastOutSlowInEasing),
            targetOffsetX = { -it }
        )
    ) {
        OnBoardingIntroQuestion(authenticationViewModel = authenticationViewModel, navController = navController) {
            showTellUsMore = true
            showOptions = false
        }
    }

    AnimatedVisibility(
        visible = showTellUsMore,
        enter = slideInHorizontally(
            animationSpec = tween(durationMillis = 300, easing = FastOutSlowInEasing),
            initialOffsetX = { it }
        )
    ) {
        TellUsMore(authenticationViewModel = authenticationViewModel)
    }
}

@Composable fun OnBoardingIntroQuestion(
    authenticationViewModel: AuthenticationViewModel,
    navController: NavController,
    onTellUsMore: () -> Unit
) {
    var selectedOption by remember { mutableStateOf(OnBoardingOption.None) }
    val party by remember {
        mutableStateOf(
            Party(
                speed = 0f,
                maxSpeed = 30f,
                damping = 0.9f,
                spread = 360,
                colors = listOf(0xfce18a, 0xff726d, 0xf4306d, 0xb48def),
                position = Position.Relative(0.5, 0.1),
                emitter = Emitter(duration = 5000, TimeUnit.MILLISECONDS).max(100)
            )
        )
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .padding(top = 40.dp)
                .padding(bottom = 184.dp)
        ) {
            Text(
                text = "What brings you to Equater?",
                style = MaterialTheme.typography.h4.copy(textAlign = TextAlign.Center),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 16.dp)
            )

            LazyColumn {
                OnBoardingOption.values().forEach { option ->
                    if (option != OnBoardingOption.None) {
                        item(option.id) {
                            RadioButtonCard(text = option.getText(), isSelected = option == selectedOption) {
                                selectedOption = if (option == selectedOption) OnBoardingOption.None else option
                            }
                        }
                    }
                }
            }
        }

        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 32.dp)
                    .padding(horizontal = 16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Button(
                    onClick = {
                        when (selectedOption) {
                            OnBoardingOption.None -> {
                                authenticationViewModel.hideOnBoardingScreen()
                            }
                            OnBoardingOption.SplitBills -> {
                                mainScope.launch(Dispatchers.Main) {
                                    delay(NAV_ANIMATION_DURATION.toLong())
                                    navController.navigate(Route.SharedBill.route)
                                }
                                selectedOption.serialize()?.let { dto ->
                                    authenticationViewModel.sendOnBoardingFeedback(dto)
                                }
                                authenticationViewModel.hideOnBoardingScreen()
                            }
                            OnBoardingOption.SplitSubscriptions -> {
                                mainScope.launch(Dispatchers.Main) {
                                    delay(NAV_ANIMATION_DURATION.toLong())
                                    navController.navigate(Route.SharedBill.route)
                                }
                                selectedOption.serialize()?.let { dto ->
                                    authenticationViewModel.sendOnBoardingFeedback(dto)
                                }
                                authenticationViewModel.hideOnBoardingScreen()
                            }
                            OnBoardingOption.ChargingTenants -> {
                                mainScope.launch(Dispatchers.Main) {
                                    delay(NAV_ANIMATION_DURATION.toLong())
                                    navController.navigate(Route.ScheduledPayment.route)
                                }
                                selectedOption.serialize()?.let { dto ->
                                    authenticationViewModel.sendOnBoardingFeedback(dto)
                                }
                                authenticationViewModel.hideOnBoardingScreen()
                            }
                            OnBoardingOption.SomethingElse -> {
                                onTellUsMore()
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(60.dp)
                ) {
                    Text(
                        text = "Next",
                        style = MaterialTheme.typography.body1.copy(fontSize = 3.5.em, color = Color.White)
                    )
                }

                TextButton(
                    onClick = {
                        authenticationViewModel.hideOnBoardingScreen()
                    },
                    modifier = Modifier
                        .padding(top = 16.dp)
                        .width(200.dp)
                        .height(60.dp)
                ) {
                    Text(
                        text = "Skip On-Boarding",
                        style = MaterialTheme.typography.body1.copy(fontSize = 3.5.em)
                    )
                }
            }
        }

        KonfettiView(modifier = Modifier.fillMaxSize(), parties = listOf(party))
    }
}

@Composable private fun TellUsMore(authenticationViewModel: AuthenticationViewModel) {
    var text by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
            .padding(top = 40.dp)
    ) {
        Text(
            text = "Great! We’d love to hear more.",
            style = MaterialTheme.typography.h5.copy(fontWeight = FontWeight.Bold)
        )
        Text(
            text = "Let us know why you’re using Equater, or tap done to skip ahead to the app!",
            style = MaterialTheme.typography.body2,
            modifier = Modifier.padding(vertical = 6.dp)
        )
        OutlinedTextField(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp),
            value = text,
            onValueChange = { text = it },
            placeholder = {
                Text(
                    text = "Why you're using Equater",
                    style = MaterialTheme.typography.body2.copy(color = textSecondaryColor().copy(alpha = 0.8f))
                )
            },
            colors = TextFieldDefaults.textFieldColors(
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
                backgroundColor = backgroundSecondary(),
                cursorColor = LocalContentColor.current.copy(alpha = LocalContentAlpha.current),
                textColor = textPrimaryColor()
            )
        )
        Button(
            onClick = {
                authenticationViewModel.hideOnBoardingScreen()
                val feedback = OnBoardingOption.SomethingElse.serialize()?.copy(additionalFeedback = text.trim())
                feedback?.let { dto ->
                    authenticationViewModel.sendOnBoardingFeedback(dto)
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(60.dp)
                .padding(top = 16.dp)
        ) {
            Text(text = "Next", style = MaterialTheme.typography.body1.copy(fontSize = 3.5.em, color = Color.White))
        }
    }
}
