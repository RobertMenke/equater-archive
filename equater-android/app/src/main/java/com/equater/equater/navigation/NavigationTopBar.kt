package com.equater.equater.navigation

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.Image
import androidx.compose.material.DrawerState
import androidx.compose.material.Icon
import androidx.compose.material.IconButton
import androidx.compose.material.Text
import androidx.compose.material.TopAppBar
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Menu
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.equater.equater.ui.AppIcon
import kotlinx.coroutines.launch

private val topNavRoutes = listOf(
    Route.CreateAgreement.route,
    Route.ManageAgreements.route,
    Route.ViewTransactions.route,
    Route.VerifiedCustomerForm.route,
    Route.AgreementDetailView.route,
    Route.TransactionDetailView.route,
    Route.Support.route,
    Route.Legal.route,
    Route.PrivacyPolicyStatic.route,
    Route.TermsOfServiceStatic.route,
    Route.DwollaBalance.route,
    Route.Settings.route,
    Route.LinkedAccounts.route,
    Route.AccountDetail.route,
    Route.Profile.route,
    Route.DangerZone.route
)

private val backLinkRoutes = listOf(
    Route.AgreementDetailView.route,
    Route.TransactionDetailView.route,
    Route.PrivacyPolicyStatic.route,
    Route.TermsOfServiceStatic.route,
    Route.DwollaBalance.route,
    Route.AccountDetail.route,
    Route.LinkedAccounts.route,
    Route.DangerZone.route,
    Route.Profile.route
)

// List of routes that exist on both the settings page and the nav drawer
private val backLinkOrDrawerRoutes = listOf(
    Route.VerifiedCustomerForm.route,
    Route.Support.route,
    Route.Legal.route
)

@Composable
fun NavigationTopBar(navController: NavHostController, drawerState: DrawerState) {
    val scope = rememberCoroutineScope()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val previousRoute = navController.previousBackStackEntry?.destination?.route
    val currentRoute = navBackStackEntry?.destination?.route
    val showTopBar = topNavRoutes.contains(currentRoute) // topNavDestinationVisible && !returningFromFullScreen

    fun openDrawer() {
        scope.launch {
            drawerState.open()
        }
    }

    @Composable fun NavIcon() {
        val lastEntryIsSettings = previousRoute == Route.Settings.route
        val shouldShowBackLinkForSettingsRoute = lastEntryIsSettings && backLinkOrDrawerRoutes.contains(currentRoute)

        if (backLinkRoutes.contains(currentRoute) || shouldShowBackLinkForSettingsRoute) {
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
            }
        } else {
            IconButton(onClick = { openDrawer() }) {
                Icon(Icons.Filled.Menu, contentDescription = "Menu")
            }
        }
    }

    @Composable fun NavAction() {
        if (currentRoute == Route.ViewTransactions.route) {
            IconButton(onClick = { navController.navigate(Route.DwollaBalance.route) }) {
                Image(painter = AppIcon.WalletGray.painterResource(), contentDescription = "View Balance")
            }
        }
    }

    val title = if (currentRoute != null) Route.title(currentRoute) ?: "" else ""

    AnimatedVisibility(
        visible = showTopBar,
        enter = EnterTransition.None,
        exit = slideOutVertically(tween(NAV_ANIMATION_DURATION), targetOffsetY = { -it })
    ) {
        TopAppBar(
            navigationIcon = { NavIcon() },
            actions = { NavAction() },
            title = { Text(text = title) },
            backgroundColor = Color.Transparent,
            elevation = 0.dp
        )
    }
}
