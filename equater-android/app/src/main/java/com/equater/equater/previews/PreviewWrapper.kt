package com.equater.equater.previews

import androidx.compose.material.DrawerValue
import androidx.compose.material.MaterialTheme
import androidx.compose.material.ModalDrawer
import androidx.compose.material.Scaffold
import androidx.compose.material.Surface
import androidx.compose.material.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.manageAgreements.AgreementViewModel
import com.equater.equater.navigation.BottomNavigationBar
import com.equater.equater.navigation.NavDrawer
import com.equater.equater.profile.ProfileViewModel
import com.equater.equater.ui.EquaterTheme

@Composable
fun PreviewWrapper(content: @Composable (NavController) -> Unit) {
    val navController = rememberNavController()
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val authViewModel: AuthenticationViewModel = hiltViewModel()
    val agreementViewModel: AgreementViewModel = hiltViewModel()
    val profileViewModel: ProfileViewModel = hiltViewModel()

    EquaterTheme {
        Surface(color = MaterialTheme.colors.background) {
            ModalDrawer(
                drawerState = drawerState,
                drawerContent = { NavDrawer(navController, authViewModel, profileViewModel, drawerState) },
                content = {
                    Scaffold(
                        content = { content(navController) },
                        bottomBar = { BottomNavigationBar(navController, authViewModel, agreementViewModel) }
                    )
                }
            )
        }
    }
}
