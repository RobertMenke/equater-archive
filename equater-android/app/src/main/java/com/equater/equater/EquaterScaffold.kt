package com.equater.equater

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.DrawerState
import androidx.compose.material.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.manageAgreements.AgreementViewModel
import com.equater.equater.navigation.BottomNavigationBar
import com.equater.equater.navigation.NavigationTopBar

/**
 * History: it was originally recommended to have 1 Scaffold for the entire application
 * and to put your nav graph inside the body of the Scaffold. This approach made animation
 * between nav destinations really clunky visually, so it ended up being cleaner to simply
 * have each nav destination that needs a Scaffold provide its own.
 *
 * Note: Each of the view model's provided to scaffold should be scoped to [@AndroidEntryPoint]
 * not to a specific nav graph destination.
 */
@Composable
fun EquaterScaffold(
    navController: NavHostController,
    authViewModel: AuthenticationViewModel,
    agreementViewModel: AgreementViewModel,
    drawerState: DrawerState,
    content: @Composable () -> Unit
) {
    Scaffold(
        topBar = { NavigationTopBar(navController, drawerState) },
        bottomBar = { BottomNavigationBar(navController, authViewModel, agreementViewModel) },
        content = {
            Box(modifier = Modifier.fillMaxSize().padding(it)) {
                content()
            }
        }
    )
}
