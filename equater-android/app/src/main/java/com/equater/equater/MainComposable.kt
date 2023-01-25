package com.equater.equater

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.widget.Toast
import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.foundation.layout.padding
import androidx.compose.material.DrawerState
import androidx.compose.material.DrawerValue
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.MaterialTheme
import androidx.compose.material.ModalDrawer
import androidx.compose.material.Surface
import androidx.compose.material.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import arrow.core.continuations.nullable
import coil.annotation.ExperimentalCoilApi
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.authentication.EnableNotifications
import com.equater.equater.authentication.PrivacyPolicy
import com.equater.equater.authentication.Registration
import com.equater.equater.authentication.ResetPassword
import com.equater.equater.authentication.ResetPasswordConfirmation
import com.equater.equater.authentication.SignIn
import com.equater.equater.authentication.SignedIn
import com.equater.equater.authentication.SignedOut
import com.equater.equater.authentication.TermsOfService
import com.equater.equater.components.FullScreenSheet
import com.equater.equater.extensions.getActivity
import com.equater.equater.homeScreen.CreateAgreementWizard
import com.equater.equater.homeScreen.ManageAgreements
import com.equater.equater.homeScreen.TransactionFilter
import com.equater.equater.homeScreen.ViewTransactions
import com.equater.equater.identityVerification.AuthenticatedVerifiedCustomerForm
import com.equater.equater.identityVerification.VerifiedCustomerForm
import com.equater.equater.legal.LegalScreen
import com.equater.equater.legal.PrivacyPolicyStatic
import com.equater.equater.legal.TermsOfServiceStatic
import com.equater.equater.linkBankAccount.AccountDetailView
import com.equater.equater.linkBankAccount.LinkedAccountsView
import com.equater.equater.linkBankAccount.ReLinkBankAccount
import com.equater.equater.linkBankAccount.SelectPaymentAccount
import com.equater.equater.manageAgreements.AgreementDetailView
import com.equater.equater.manageAgreements.AgreementDetailViewFromDeepLink
import com.equater.equater.manageAgreements.AgreementViewModel
import com.equater.equater.navigation.NavDrawer
import com.equater.equater.navigation.Route
import com.equater.equater.onBoarding.OnBoarding
import com.equater.equater.onBoarding.WelcomeToEquater
import com.equater.equater.profile.ProfileScreen
import com.equater.equater.profile.ProfileScreenAuthenticated
import com.equater.equater.profile.ProfileViewModel
import com.equater.equater.settings.DangerZone
import com.equater.equater.settings.SettingsView
import com.equater.equater.sharedExpenseCreation.scheduledPayment.ScheduledPayment
import com.equater.equater.sharedExpenseCreation.sharedBill.SharedBill
import com.equater.equater.support.SupportScreen
import com.equater.equater.transaction.EquaterBalance
import com.equater.equater.transaction.TransactionDetailView
import com.equater.equater.transaction.TransactionDetailViewFromDeepLink
import com.equater.equater.transaction.TransactionViewModel
import com.equater.equater.ui.EquaterTheme
import com.equater.equater.utils.onBoardingNavigation
import com.google.accompanist.navigation.animation.AnimatedNavHost
import com.google.accompanist.navigation.animation.rememberAnimatedNavController
import timber.log.Timber

@OptIn(ExperimentalAnimationApi::class, ExperimentalAnimationApi::class)
@ExperimentalCoilApi
@ExperimentalMaterialApi
@Composable
fun Equater() {
    val navController = rememberAnimatedNavController()
    // This instance is scoped to the @AndroidEntryPoint, not to a NavBackStackEntry.
    // It's important that this instance is shared by any composable that does not intend to re-fetch user
    // state when attempting to observe the authenticated user.
    val authViewModel: AuthenticationViewModel = hiltViewModel()
    // Important - scoped to @AndroidEntryPoint
    val agreementViewModel: AgreementViewModel = hiltViewModel()
    val profileViewModel: ProfileViewModel = hiltViewModel()
    val accountToReLink by authViewModel.accountRequiringRelink.collectAsState()
    val paymentAccountSelectionIsShowing by agreementViewModel.showPaymentAccountSelection.collectAsState()
    val showOnBoardingIntroQuestion by authViewModel.showOnBoardingIntroQuestion.collectAsState()
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)

    EquaterTheme {
        Surface(color = MaterialTheme.colors.background) {
            // Note: There used to be a top-level scaffold here, but because of issues
            // animating between nav graph destinations cleanly our updated structure
            // supplies a [Scaffold] for each nav graph destination that requires one
            ModalDrawer(
                drawerState = drawerState,
                gesturesEnabled = drawerState.isOpen,
                drawerContent = { NavDrawer(navController, authViewModel, profileViewModel, drawerState) },
                content = {
                    AppBody(navController = navController, drawerState = drawerState)
                }
            )

            // Bank account update - will fill max size. Should only be triggered when fetching [UserAccount]
            // entities from the server
            FullScreenSheet(isShowing = accountToReLink != null, content = {
                accountToReLink?.let { account ->
                    ReLinkBankAccount(account = account) { updatedAccount ->
                        authViewModel.accountRequiringRelink.value = null
                        if (updatedAccount != null) {
                            authViewModel.updateAccountCache(updatedAccount)
                        }
                    }
                }
            })

            // Payment account selection - will fill max size. See ManageAgreements/AgreementDetailView
            FullScreenSheet(
                isShowing = paymentAccountSelectionIsShowing,
                content = {
                    SelectPaymentAccount(
                        agreementViewModel,
                        authViewModel,
                        titleText = "Which account would you like to use for payment?",
                        setIsShowing = { showing ->
                            agreementViewModel.showPaymentAccountSelection.value = showing
                        },
                        onSelected = {
                            agreementViewModel.showPaymentAccountSelection.value = false
                            agreementViewModel.setPaymentAccountId(it.id)
                            agreementViewModel.afterPaymentAccountLinked.value.invoke(it)
                        }
                    )
                }
            )

            // On-boarding intro question. Only shown the first time a sign-in occurs for a given user.
            FullScreenSheet(
                isShowing = showOnBoardingIntroQuestion,
                content = {
                    OnBoarding(authViewModel, navController)
                }
            )
        }
    }
}

@OptIn(ExperimentalAnimationApi::class)
@ExperimentalCoilApi
@ExperimentalMaterialApi
@Composable
fun AppBody(navController: NavHostController, drawerState: DrawerState) {
    val context = LocalContext.current
    // This instance is scoped to the @AndroidEntryPoint, not to a NavBackStackEntry.
    // It's important that this instance is shared by any composable that does not intend to re-fetch user
    // state when attempting to observe the authenticated user.
    val authViewModel: AuthenticationViewModel = hiltViewModel()
    // Important - scoped to @AndroidEntryPoint
    val agreementViewModel: AgreementViewModel = hiltViewModel()
    // Important - scoped to @AndroidEntryPoint
    val transactionViewModel: TransactionViewModel = hiltViewModel()
    val signInState by authViewModel.signInState.collectAsState()
    var previousSignInState by remember { mutableStateOf(authViewModel.signInState.value) }

    LaunchedEffect(signInState) {
        when (signInState) {
            is SignedIn -> {
                Timber.d("Signed in")
            }
            is SignedOut -> {
                if (previousSignInState is SignedIn) {
                    navController.navigate(Route.WelcomeToEquater.route)
                }
            }
        }

        previousSignInState = signInState
    }

    AnimatedNavHost(navController = navController, startDestination = Route.SplashScreen.route) {
        // Authentication
        Route.SplashScreen.composable(this) { SplashScreen(navController, authViewModel) }
        Route.WelcomeToEquater.composable(this) { WelcomeToEquater(navController) }
        Route.SignIn.composable(this) { SignIn(navController, authViewModel) }
        Route.Registration.composable(this) { Registration(navController, authViewModel) }
        Route.ResetPassword.composable(this) { ResetPassword(navController, authViewModel) }
        Route.ResetPasswordConfirmation.composable(this) {
            ResetPasswordConfirmation(navController, authViewModel)
        }
        // On-Boarding
        Route.ProfileOnBoarding.composable(this) {
            ProfileScreen(authViewModel, showOnBoardingInstructions = true) { user ->
                navController.onBoardingNavigation(authViewModel.getUserOnBoardingState(user))
                // If a user is signing up after being invited we automatically fetch their agreements
                // on sign-in, however, we don't have their name yet at that point so their profile
                // pic would just show an empty avatar. Re-fetch agreements here to ensure we at least
                // show initials on any avatar.
                if (agreementViewModel.agreements.value.isNotEmpty()) {
                    agreementViewModel.syncUserAgreements(user.id)
                }
            }
        }
        Route.VerifiedCustomerFormOnBoarding.composable(this) {
            VerifiedCustomerForm(authViewModel, modifier = Modifier.padding(top = 16.dp)) {
                if (shouldAskNotificationPermission(context)) {
                    navController.navigate(Route.EnableNotifications.route)
                } else {
                    navController.navigate(Route.TermsOfService.route)
                }
            }
        }
        Route.EnableNotifications.composable(this) {
            EnableNotifications(authViewModel) {
                navController.navigate(Route.TermsOfService.route)
            }
        }
        Route.TermsOfService.composable(this) {
            EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                TermsOfService(navController, authViewModel)
            }
        }
        Route.PrivacyPolicy.composable(this) {
            EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                PrivacyPolicy(navController, authViewModel)
            }
        }
        // Main Content
        Route.CreateAgreement.composable(this) {
            EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                CreateAgreementWizard(navController)
            }
        }
        Route.ManageAgreements.composable(this) { backStack ->
            val tabNumber = backStack.arguments?.getString("tab") ?: "0"
            val tabIndex = tabNumber.toInt()
            val tab = if (tabIndex in 0..2) tabIndex else 0
            EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                ManageAgreements(navController, authViewModel, agreementViewModel, tab)
            }
        }
        Route.ViewTransactions.composable(this) { backStack ->
            EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                ViewTransactions(
                    navController,
                    authViewModel,
                    transactionViewModel,
                    TransactionFilter.fromBackStackEntry(backStack, transactionViewModel)
                )
            }
        }
        Route.DwollaBalance.composable(this) {
            EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                EquaterBalance(authViewModel)
            }
        }
        Route.AgreementDetailView.composable(this) { navBackStackEntry ->
            val expenseId = nullable.eager {
                navBackStackEntry.arguments?.getString("sharedExpenseId").bind().run(Integer::parseInt)
            }

            val story = nullable.eager {
                agreementViewModel.agreements.value.firstOrNull { it.sharedExpense.id == expenseId.bind() }
            }

            when {
                story != null -> {
                    EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                        AgreementDetailView(navController, authViewModel, agreementViewModel, story)
                    }
                }
                expenseId != null -> {
                    EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                        AgreementDetailViewFromDeepLink(navController, authViewModel, agreementViewModel, expenseId)
                    }
                }
                else -> {
                    // Should never happen, but just in case
                    navController.popBackStack()
                }
            }
        }
        Route.TransactionDetailView.composable(this) { navBackStackEntry ->
            val transactionId = nullable.eager {
                navBackStackEntry.arguments?.getString("transactionId").bind().run(Integer::parseInt)
            }

            val story = nullable.eager {
                transactionViewModel.transactions.value.firstOrNull { it.transaction.id == transactionId.bind() }
            }

            when {
                story != null -> {
                    EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                        TransactionDetailView(
                            navController = navController,
                            agreementViewModel = agreementViewModel,
                            story = story
                        )
                    }
                }
                transactionId != null -> {
                    EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                        TransactionDetailViewFromDeepLink(
                            navController,
                            agreementViewModel,
                            transactionViewModel,
                            transactionId
                        )
                    }
                }
                else -> {
                    // Should never happen, but just in case go back
                    navController.popBackStack()
                }
            }
        }
        // Creating shared bills
        Route.SharedBill.composable(this) {
            EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                SharedBill(navController = navController, authenticationViewModel = authViewModel)
            }
        }
        Route.ScheduledPayment.composable(this) {
            EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                ScheduledPayment(navController = navController, authenticationViewModel = authViewModel)
            }
        }
        // Sidebar Menu Screens
        Route.Settings.composable(this) {
            EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                SettingsView(navController, authViewModel)
            }
        }
        Route.Profile.composable(this) {
            EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                ProfileScreenAuthenticated(
                    authViewModel,
                    showOnBoardingInstructions = false,
                    onSave = {
                        Timber.d("Saved profile")
                        Toast.makeText(context, "Profile has been updated", Toast.LENGTH_LONG).show()
                    }
                )
            }
        }
        Route.VerifiedCustomerForm.composable(this) {
            EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                AuthenticatedVerifiedCustomerForm(authViewModel, modifier = Modifier.padding(top = 4.dp))
            }
        }
        Route.Support.composable(this) {
            EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                SupportScreen()
            }
        }
        Route.Legal.composable(this) {
            EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                LegalScreen(navController = navController)
            }
        }
        Route.PrivacyPolicyStatic.composable(this) {
            EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                PrivacyPolicyStatic()
            }
        }
        Route.TermsOfServiceStatic.composable(this) {
            EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                TermsOfServiceStatic()
            }
        }
        Route.Settings.composable(this) {
            EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                SettingsView(navController, authViewModel)
            }
        }
        Route.LinkedAccounts.composable(this) {
            EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                LinkedAccountsView(navController, authViewModel)
            }
        }
        Route.AccountDetail.composable(this) { navBackStackEntry ->
            val accountId = nullable.eager {
                navBackStackEntry.arguments?.getString("accountId").bind().run(Integer::parseInt)
            }
            val userAccounts by authViewModel.authenticatedUserAccounts.collectAsState()

            val account = userAccounts.first { it.id == accountId }
            EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                AccountDetailView(navController, authViewModel, agreementViewModel, account)
            }
        }
        Route.DangerZone.composable(this) {
            EquaterScaffold(navController, authViewModel, agreementViewModel, drawerState) {
                DangerZone(navController, authViewModel)
            }
        }
    }
}

fun shouldAskNotificationPermission(context: Context): Boolean {
    // This is only necessary for API level >= 33 (TIRAMISU)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        return if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED
        ) {
            false
        } else {
            context.getActivity()?.shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS) == true
        }
    }

    return false
}
