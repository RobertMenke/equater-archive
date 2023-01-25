package com.equater.equater.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.DrawerState
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Surface
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.components.AuthenticatedUserAvatar
import com.equater.equater.components.ColorIcon
import com.equater.equater.profile.ProfileViewModel
import com.equater.equater.ui.AppIcon
import com.equater.equater.ui.EquaterTheme
import com.equater.equater.ui.backgroundSecondary
import com.equater.equater.ui.frameFillParent
import com.equater.equater.ui.frameFillWidth
import kotlinx.coroutines.launch
import timber.log.Timber

/**
 * Note: All view models passed to the nav drawer must be scoped to [@AndroidEntryPoint]
 */
@Composable
fun NavDrawer(
    navController: NavHostController,
    authViewModel: AuthenticationViewModel,
    profileViewModel: ProfileViewModel,
    drawerState: DrawerState
) {
    val scope = rememberCoroutineScope()
    val authenticatedUser by authViewModel.authenticatedUser.collectAsState()

    LaunchedEffect(authenticatedUser) {
        authenticatedUser?.let { user ->
            profileViewModel.setUser(user)
        }
    }

    EquaterTheme {
        Surface(color = MaterialTheme.colors.background) {
            Column(modifier = frameFillParent) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .weight(0.8f)
                        .fillMaxWidth()
                        .background(backgroundSecondary())
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        AuthenticatedUserAvatar(profileViewModel = profileViewModel, authViewModel = authViewModel) {
                            navController.navigate(Route.Profile.route)
                            scope.launch {
                                drawerState.close()
                            }
                        }

                        authenticatedUser?.let { user ->
                            Text(
                                "${user.firstName} ${user.lastName}",
                                modifier = Modifier.padding(top = 8.dp),
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }

                Box(
                    modifier = Modifier
                        .weight(2f)
                        .background(MaterialTheme.colors.background)
                ) {
                    LazyColumn {
                        item {
                            NavDrawerRow(icon = AppIcon.Create.painterResource(), text = "Create Agreement") {
                                navController.navigate(Route.CreateAgreement.route)
                                scope.launch {
                                    drawerState.close()
                                }
                            }
                        }

                        item {
                            NavDrawerRow(icon = AppIcon.BalanceScale.painterResource(), text = "Manage Agreements") {
                                navController.navigate(Route.ManageAgreements.route)
                                scope.launch {
                                    drawerState.close()
                                }
                            }
                        }

                        item {
                            NavDrawerRow(icon = AppIcon.CreditCard.painterResource(), text = "Transaction History") {
                                navController.navigate(Route.ViewTransactions.route)
                                scope.launch {
                                    drawerState.close()
                                }
                            }
                        }

                        item {
                            NavDrawerRow(icon = AppIcon.Settings.painterResource(), text = "Settings") {
                                navController.navigate(Route.Settings.route)
                                scope.launch {
                                    drawerState.close()
                                }
                            }
                        }

                        item {
                            NavDrawerRow(
                                icon = AppIcon.UserSuccessCircle.painterResource(),
                                text = "Identity Verification"
                            ) {
                                navController.navigate(Route.VerifiedCustomerForm.route)
                                scope.launch {
                                    drawerState.close()
                                }
                            }
                        }

                        item {
                            NavDrawerRow(icon = AppIcon.Phone.painterResource(), text = "Support") {
                                Timber.d("Support")
                                navController.navigate(Route.Support.route)
                                scope.launch {
                                    drawerState.close()
                                }
                            }
                        }

                        item {
                            NavDrawerRow(icon = AppIcon.Logout.painterResource(), text = "Sign Out") {
                                authViewModel.signOut()
                                navController.navigate(Route.WelcomeToEquater.route) {
                                    popUpTo(navController.graph.startDestinationId)
                                }
                                scope.launch {
                                    drawerState.close()
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun NavDrawerRow(icon: Painter, text: String, action: () -> Unit) {
    Row(
        modifier = Modifier
            .frameFillWidth(60.dp)
            .clickable(onClick = action),
        verticalAlignment = Alignment.CenterVertically
    ) {
        ColorIcon(icon, modifier = Modifier.padding(start = 16.dp, end = 16.dp))
        Text(text)
    }
}
