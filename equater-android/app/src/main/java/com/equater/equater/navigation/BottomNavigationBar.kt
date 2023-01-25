package com.equater.equater.navigation

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.layout.offset
import androidx.compose.material.Badge
import androidx.compose.material.BadgedBox
import androidx.compose.material.BottomNavigation
import androidx.compose.material.BottomNavigationItem
import androidx.compose.material.TabRowDefaults.Divider
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.equater.equater.R
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.manageAgreements.AgreementViewModel
import com.equater.equater.sharedExpenseCreation.filterByInvitations
import com.equater.equater.ui.AppIcon
import com.equater.equater.ui.accentPrimaryForText
import com.equater.equater.ui.backgroundPrimary
import com.equater.equater.ui.backgroundSecondary

private val bottomNavRoutes = listOf(
    Route.CreateAgreement.route,
    Route.ManageAgreements.route,
    Route.ViewTransactions.route
)
private val bottomNavScreens: List<BottomNavigationScreen> = listOf(
    BottomNavDestination.CreateExpenseAgreement(R.string.create_agreement, AppIcon.Create),
    BottomNavDestination.ManageAgreements(R.string.manage_agreement, AppIcon.BalanceScale),
    BottomNavDestination.ViewTransactions(R.string.transaction_history, AppIcon.CreditCard)
)

@Composable
fun BottomNavigationBar(
    navController: NavHostController,
    authViewModel: AuthenticationViewModel,
    agreementViewModel: AgreementViewModel
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val user by authViewModel.authenticatedUser.collectAsState()
    val authenticatedUser = user ?: return
    val agreements by agreementViewModel.agreements.collectAsState()
    val invitations = agreements.filterByInvitations(authenticatedUser)
    val showBottomBar = bottomNavRoutes.contains(currentRoute)

    AnimatedVisibility(
        visible = showBottomBar,
        enter = EnterTransition.None,
        exit = slideOutVertically(tween(NAV_ANIMATION_DURATION), targetOffsetY = { it })
    ) {
        Divider(color = backgroundSecondary())
        BottomNavigation(
            backgroundColor = backgroundPrimary().copy(alpha = 0.8f),
            elevation = 0.dp,
            modifier = Modifier.blur(16.dp)
        ) {
            bottomNavScreens.forEach { screen ->
                BottomNavigationItem(
                    icon = {
                        // Show a notification for the manage agreements tab when there is an outstanding invitation
                        if (screen.route == bottomNavScreens[1].route && invitations.isNotEmpty()) {
                            BadgedBox(
                                badge = {
                                    Badge(
                                        backgroundColor = accentPrimaryForText(),
                                        modifier = Modifier.offset(y = 8.dp)
                                    ) {
                                        Text(text = "${invitations.count()}", color = Color.White)
                                    }
                                }
                            ) {
                                if (currentRoute != screen.route) screen.icon.getIcon() else screen.icon.getColorIcon()
                            }
                        } else {
                            if (currentRoute != screen.route) screen.icon.getIcon() else screen.icon.getColorIcon()
                        }
                    },
                    label = { Text(stringResource(screen.resourceId)) },
                    selected = currentRoute == screen.route,
                    onClick = {
                        navController.navigate(screen.route) {
                            // Pop up to the start destination of the graph to
                            // avoid building up a large stack of destinations
                            // on the back stack as users select items
                            popUpTo(navController.graph.startDestinationId)
                            // Avoid multiple copies of the same destination when
                            // reselecting the same item
                            launchSingleTop = true
                            // Restore state when reselecting a previously selected item
                            restoreState = true
                        }
                    }
                )
            }
        }
    }
}
