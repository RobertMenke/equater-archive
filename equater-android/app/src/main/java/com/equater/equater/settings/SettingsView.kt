package com.equater.equater.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.equater.equater.R
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.authentication.User
import com.equater.equater.components.AuthenticatedUserAvatar
import com.equater.equater.components.ColorIcon
import com.equater.equater.navigation.Route
import com.equater.equater.profile.ProfileViewModel
import com.equater.equater.ui.AppIcon
import com.equater.equater.ui.backgroundSecondary
import com.equater.equater.ui.frameFillParent
import com.equater.equater.ui.textSecondaryColor

@Composable
fun SettingsView(
    navController: NavController,
    authViewModel: AuthenticationViewModel,
    profileViewModel: ProfileViewModel = hiltViewModel()
) {
    val authenticatedUser by authViewModel.authenticatedUser.collectAsState()
    val user = authenticatedUser ?: return

    SideEffect {
        profileViewModel.setUser(user)
    }

    Column(modifier = frameFillParent) {
        UserPictureAndName(user = user, authViewModel = authViewModel, profileViewModel = profileViewModel)
        SettingsList(navController)
    }
}

@Composable
private fun ColumnScope.UserPictureAndName(
    user: User,
    authViewModel: AuthenticationViewModel,
    profileViewModel: ProfileViewModel
) {
    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .weight(0.6f)
            .fillMaxWidth()
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.fillMaxSize()
        ) {
            AuthenticatedUserAvatar(
                profileViewModel = profileViewModel,
                authViewModel = authViewModel,
                background = backgroundSecondary(),
                size = 80.dp
            )

            Text(
                "${user.firstName} ${user.lastName}",
                modifier = Modifier.padding(top = 8.dp),
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun ColumnScope.SettingsList(navController: NavController) {
    Box(
        modifier = Modifier
            .weight(2f)
            .background(MaterialTheme.colors.background)
    ) {
        LazyColumn(modifier = Modifier.fillMaxSize()) {
            item {
                SectionHeader(title = "ABOUT YOU")
            }
            item {
                SettingsRow(icon = AppIcon.UserProfile.painterResource(), text = "Profile") {
                    navController.navigate(Route.Profile.route)
                }
            }
            item {
                SettingsRow(icon = AppIcon.UserSuccessCircle.painterResource(), text = "Identity Verification") {
                    navController.navigate(Route.VerifiedCustomerForm.route)
                }
            }
            item {
                SectionHeader(title = "ACCOUNT")
            }
            item {
                SettingsRow(icon = AppIcon.CardSuccess.painterResource(), text = "Linked Accounts") {
                    navController.navigate(Route.LinkedAccounts.route)
                }
            }
            item {
                SettingsRow(icon = AppIcon.DangerZone.painterResource(), text = "Danger Zone") {
                    navController.navigate(Route.DangerZone.route)
                }
            }
            item {
                SectionHeader(title = "EQUATER")
            }
            item {
                SettingsRow(icon = AppIcon.CallDialPad.painterResource(), text = "Support") {
                    navController.navigate(Route.Support.route)
                }
            }
            item {
                SettingsRow(icon = AppIcon.File.painterResource(), text = "Legal") {
                    navController.navigate(Route.Legal.route)
                }
            }
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(28.dp)
            .background(backgroundSecondary()),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title.uppercase(),
            style = MaterialTheme.typography.body2.copy(fontSize = 11.sp, color = textSecondaryColor()),
            modifier = Modifier.padding(horizontal = 14.dp)
        )
    }
}

@Composable
private fun SettingsRow(icon: Painter, text: String, action: () -> Unit) {
    val drawable =
        if (isSystemInDarkTheme()) R.drawable.chevron_right_dark_mode else R.drawable.chevron_right_light_mode

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(80.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .clickable { action() },
            verticalAlignment = Alignment.CenterVertically
        ) {
            ColorIcon(icon, modifier = Modifier.padding(start = 16.dp, end = 16.dp))
            Text(text)
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
                .padding(end = 16.dp),
            contentAlignment = Alignment.CenterEnd
        ) {
            AsyncImage(model = drawable, contentDescription = "Right Arrow")
        }
    }
}
