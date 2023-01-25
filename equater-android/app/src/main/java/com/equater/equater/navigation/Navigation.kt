package com.equater.equater.navigation

import androidx.annotation.StringRes
import androidx.compose.animation.AnimatedContentScope
import androidx.compose.animation.AnimatedVisibilityScope
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.runtime.Composable
import androidx.navigation.NamedNavArgument
import androidx.navigation.NavBackStackEntry
import androidx.navigation.NavGraphBuilder
import androidx.navigation.navArgument
import androidx.navigation.navDeepLink
import com.equater.equater.BuildConfig
import com.equater.equater.ui.AppIcon
import com.equater.equater.utils.find
import com.google.accompanist.navigation.animation.composable

interface BottomNavigationScreen {
    val route: String
    val resourceId: Int
    val icon: AppIcon
}

private const val webUrlBase = BuildConfig.WEB_BASE
const val NAV_ANIMATION_DURATION = 500

enum class Route(val route: String) {
    //region auth
    SplashScreen("entry"),
    WelcomeToEquater("welcome"),
    SignIn("sign-in"),
    Registration("registration"),
    ResetPassword("reset-password"),
    ResetPasswordConfirmation("reset-password-confirmation"),

    //region On Boarding
    ProfileOnBoarding("profile-on-boarding"),
    VerifiedCustomerFormOnBoarding("verified-customer-form-on-boarding"),
    EnableNotifications("enable-notifications"),
    TermsOfService("terms-of-service"),
    PrivacyPolicy("privacy-policy"),

    //region bottom-nav
    CreateAgreement("create-agreement"),
    ManageAgreements("agreements?tab={tab}"),
    ViewTransactions("transactions?filter={filter}"),

    // region Shared Bill
    SharedBill("shared-bill"),

    // region Scheduled Payment
    ScheduledPayment("scheduled-payment"),

    // region Agreements
    AgreementDetailView("agreement/detail/{sharedExpenseId}"),

    // region Transactions
    TransactionDetailView("transaction/detail/{transactionId}"),
    DwollaBalance("balance"),

    //region misc
    Settings("settings"),
    LinkedAccounts("accounts"),
    AccountDetail("accounts/{accountId}"),
    DangerZone("danger-zone"),
    Profile("profile"),
    VerifiedCustomerForm("verified-customer-form"),
    Support("support"),
    Legal("legal"),
    PrivacyPolicyStatic("privacy-policy-static"),
    TermsOfServiceStatic("terms-of-service-static");

    fun getTitle(): String {
        return when (this) {
            SplashScreen -> "Splash Screen"
            WelcomeToEquater -> "Welcome To Equater"
            SignIn -> "Sign In"
            Registration -> "Register"
            ResetPassword -> "Reset Password"
            ResetPasswordConfirmation -> "Password Reset Requested"
            ProfileOnBoarding -> "Profile"
            VerifiedCustomerFormOnBoarding -> "Identity Verification"
            EnableNotifications -> "Enable Notifications"
            TermsOfService -> "Terms of Service"
            PrivacyPolicy -> "Privacy Policy"
            CreateAgreement -> "Create Agreement"
            ManageAgreements -> "Agreements"
            ViewTransactions -> "Transactions"
            DwollaBalance -> "Equater Balance"
            SharedBill -> "New Shared Bill"
            ScheduledPayment -> "New Scheduled Payment"
            AgreementDetailView -> "Agreement Detail"
            TransactionDetailView -> "Transaction Detail"
            Profile -> "Profile"
            VerifiedCustomerForm -> "Identity Verification"
            Support -> "Support"
            Legal -> "Legal"
            PrivacyPolicyStatic -> "Privacy Policy"
            TermsOfServiceStatic -> "Terms of Service"
            Settings -> "Settings"
            LinkedAccounts -> "Linked Accounts"
            AccountDetail -> "Account Detail"
            DangerZone -> "Danger Zone"
        }
    }

    private fun getNavArguments(): List<NamedNavArgument> {
        return when (this) {
            ViewTransactions -> listOf(navArgument("filter") { nullable = true })
            ManageAgreements -> listOf(navArgument("tab") { nullable = true })
            else -> listOf()
        }
    }

    @OptIn(ExperimentalAnimationApi::class)
    fun composable(
        context: NavGraphBuilder,
        content: @Composable AnimatedVisibilityScope.(NavBackStackEntry) -> Unit
    ) {
        context.composable(
            route = this@Route.route,
            arguments = getNavArguments(),
            deepLinks = listOf(navDeepLink { uriPattern = "$webUrlBase/app/${this@Route.route}" }),
            content = content,
            enterTransition = { getEnterTransition() },
            exitTransition = { getExitTransition() },
            popEnterTransition = { getPopEnterTransition() },
            popExitTransition = { getPopExitTransition() }
        )
    }

    @OptIn(ExperimentalAnimationApi::class)
    private fun AnimatedContentScope<NavBackStackEntry>.getEnterTransition(): EnterTransition {
        val initialRoute = initialState.destination.route
        return when (this@Route) {
            CreateAgreement -> {
                when (initialRoute) {
                    SignIn.route, PrivacyPolicy.route, SharedBill.route, ScheduledPayment.route -> slideIntoContainer(
                        AnimatedContentScope.SlideDirection.Left,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                    else -> fadeIn(tween(NAV_ANIMATION_DURATION))
                }
            }
            WelcomeToEquater -> {
                when (initialRoute) {
                    SignIn.route, Registration.route -> slideIntoContainer(
                        AnimatedContentScope.SlideDirection.Left,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                    else -> fadeIn(tween(NAV_ANIMATION_DURATION))
                }
            }
            ManageAgreements -> {
                if (initialRoute?.contains("agreement/detail") == true) {
                    slideIntoContainer(
                        AnimatedContentScope.SlideDirection.Left,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                } else if (initialRoute?.contains(SharedBill.route) == true || initialRoute?.contains(
                        ScheduledPayment.route
                    ) == true
                ) {
                    // When finishing the agreement creation process we want to navigate to manage agreements but appear as if we're navigating backwards
                    slideIntoContainer(
                        AnimatedContentScope.SlideDirection.Right,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                } else {
                    fadeIn(tween(NAV_ANIMATION_DURATION))
                }
            }
            ViewTransactions -> {
                val isTransactionDetail = initialRoute?.contains("transaction/detail") == true
                val isDwollaBalance = initialState.destination.route == DwollaBalance.route

                if (isTransactionDetail || isDwollaBalance) {
                    slideIntoContainer(
                        AnimatedContentScope.SlideDirection.Left,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                } else {
                    fadeIn(tween(NAV_ANIMATION_DURATION))
                }
            }
            Legal -> {
                when (initialState.destination.route) {
                    PrivacyPolicyStatic.route, TermsOfServiceStatic.route, Settings.route -> slideIntoContainer(
                        AnimatedContentScope.SlideDirection.Left,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                    else -> fadeIn(tween(NAV_ANIMATION_DURATION))
                }
            }
            VerifiedCustomerForm, Support -> {
                when (initialState.destination.route) {
                    Settings.route -> slideIntoContainer(
                        AnimatedContentScope.SlideDirection.Left,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                    else -> fadeIn(tween(NAV_ANIMATION_DURATION))
                }
            }
            SplashScreen, Settings -> {
                fadeIn(tween(NAV_ANIMATION_DURATION))
            }
            SharedBill -> {
                slideIntoContainer(
                    AnimatedContentScope.SlideDirection.Left,
                    animationSpec = tween(NAV_ANIMATION_DURATION, delayMillis = 100)
                )
            }
            else -> slideIntoContainer(
                AnimatedContentScope.SlideDirection.Left,
                animationSpec = tween(NAV_ANIMATION_DURATION)
            )
        }
    }

    @OptIn(ExperimentalAnimationApi::class)
    private fun AnimatedContentScope<NavBackStackEntry>.getExitTransition(): ExitTransition {
        val targetRoute = targetState.destination.route

        return when (this@Route) {
            CreateAgreement -> {
                when (targetRoute) {
                    SignIn.route, PrivacyPolicy.route, SharedBill.route, ScheduledPayment.route -> slideOutOfContainer(
                        AnimatedContentScope.SlideDirection.Left,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                    else -> fadeOut(tween(NAV_ANIMATION_DURATION))
                }
            }
            WelcomeToEquater -> {
                when (targetRoute) {
                    SignIn.route, Registration.route -> slideOutOfContainer(
                        AnimatedContentScope.SlideDirection.Left,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                    else -> fadeOut(tween(NAV_ANIMATION_DURATION))
                }
            }
            ManageAgreements -> {
                if (targetRoute?.contains("agreement/detail") == true) {
                    slideOutOfContainer(
                        AnimatedContentScope.SlideDirection.Left,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                } else {
                    fadeOut(tween(NAV_ANIMATION_DURATION))
                }
            }
            ViewTransactions -> {
                val isTransactionDetail = targetRoute?.contains("transaction/detail") == true
                val isDwollaBalance = targetRoute == DwollaBalance.route

                if (isTransactionDetail || isDwollaBalance) {
                    slideOutOfContainer(
                        AnimatedContentScope.SlideDirection.Left,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                } else {
                    fadeOut(tween(NAV_ANIMATION_DURATION))
                }
            }
            Legal -> {
                when (targetRoute) {
                    PrivacyPolicyStatic.route, TermsOfServiceStatic.route, Settings.route -> slideOutOfContainer(
                        AnimatedContentScope.SlideDirection.Left,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                    else -> fadeOut(tween(NAV_ANIMATION_DURATION))
                }
            }
            VerifiedCustomerForm, Support -> {
                when (targetRoute) {
                    Settings.route -> slideOutOfContainer(
                        AnimatedContentScope.SlideDirection.Left,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                    else -> fadeOut(tween(NAV_ANIMATION_DURATION))
                }
            }
            SplashScreen, Settings -> {
                fadeOut(tween(NAV_ANIMATION_DURATION))
            }
            SharedBill, ScheduledPayment -> {
                // When finishing the agreement creation process we want to navigate to manage agreements but appear as if we're navigating backwards
                if (targetRoute?.contains(ManageAgreements.route) == true) {
                    slideOutOfContainer(
                        AnimatedContentScope.SlideDirection.Right,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                } else {
                    slideOutOfContainer(
                        AnimatedContentScope.SlideDirection.Left,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                }
            }
            else -> slideOutOfContainer(
                AnimatedContentScope.SlideDirection.Left,
                animationSpec = tween(NAV_ANIMATION_DURATION)
            )
        }
    }

    @OptIn(ExperimentalAnimationApi::class)
    private fun AnimatedContentScope<NavBackStackEntry>.getPopEnterTransition(): EnterTransition {
        val initialRoute = initialState.destination.route

        return when (this@Route) {
            CreateAgreement -> {
                when (initialRoute) {
                    SignIn.route, PrivacyPolicy.route, SharedBill.route, ScheduledPayment.route -> slideIntoContainer(
                        AnimatedContentScope.SlideDirection.Right,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                    else -> fadeIn(tween(NAV_ANIMATION_DURATION))
                }
            }
            WelcomeToEquater -> {
                when (initialRoute) {
                    SignIn.route, Registration.route -> slideIntoContainer(
                        AnimatedContentScope.SlideDirection.Right,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                    else -> fadeIn(tween(NAV_ANIMATION_DURATION))
                }
            }
            ManageAgreements -> {
                if (initialRoute?.contains("agreement/detail") == true) {
                    slideIntoContainer(
                        AnimatedContentScope.SlideDirection.Right,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                } else {
                    fadeIn(tween(NAV_ANIMATION_DURATION))
                }
            }
            ViewTransactions -> {
                val isTransactionDetail = initialRoute?.contains("transaction/detail") == true
                val isDwollaBalance = initialState.destination.route == DwollaBalance.route

                if (isTransactionDetail || isDwollaBalance) {
                    slideIntoContainer(
                        AnimatedContentScope.SlideDirection.Right,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                } else {
                    fadeIn(tween(NAV_ANIMATION_DURATION))
                }
            }
            Legal -> {
                when (initialState.destination.route) {
                    PrivacyPolicyStatic.route, TermsOfServiceStatic.route, Settings.route -> slideIntoContainer(
                        AnimatedContentScope.SlideDirection.Right,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                    else -> fadeIn(tween(NAV_ANIMATION_DURATION))
                }
            }
            Support, VerifiedCustomerForm -> {
                when (initialState.destination.route) {
                    Settings.route -> slideIntoContainer(
                        AnimatedContentScope.SlideDirection.Right,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                    else -> fadeIn(tween(NAV_ANIMATION_DURATION))
                }
            }
            SplashScreen, Settings -> {
                fadeIn(tween(NAV_ANIMATION_DURATION))
            }
            else -> slideIntoContainer(
                AnimatedContentScope.SlideDirection.Right,
                animationSpec = tween(NAV_ANIMATION_DURATION)
            )
        }
    }

    @OptIn(ExperimentalAnimationApi::class)
    private fun AnimatedContentScope<NavBackStackEntry>.getPopExitTransition(): ExitTransition {
        val targetRoute = targetState.destination.route

        return when (this@Route) {
            CreateAgreement -> {
                when (targetRoute) {
                    SignIn.route, PrivacyPolicy.route, SharedBill.route, ScheduledPayment.route -> slideOutOfContainer(
                        AnimatedContentScope.SlideDirection.Right,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                    else -> fadeOut(tween(NAV_ANIMATION_DURATION))
                }
            }
            WelcomeToEquater -> {
                when (targetRoute) {
                    SignIn.route, Registration.route -> slideOutOfContainer(
                        AnimatedContentScope.SlideDirection.Right,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                    else -> fadeOut(tween(NAV_ANIMATION_DURATION))
                }
            }
            ManageAgreements -> {
                if (targetRoute?.contains("agreement/detail") == true) {
                    slideOutOfContainer(
                        AnimatedContentScope.SlideDirection.Right,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                } else {
                    fadeOut(tween(NAV_ANIMATION_DURATION))
                }
            }
            ViewTransactions -> {
                val isTransactionDetail = targetRoute?.contains("transaction/detail") == true
                val isDwollaBalance = targetRoute == DwollaBalance.route

                if (isTransactionDetail || isDwollaBalance) {
                    slideOutOfContainer(
                        AnimatedContentScope.SlideDirection.Right,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                } else {
                    fadeOut(tween(NAV_ANIMATION_DURATION))
                }
            }
            Legal -> {
                when (targetRoute) {
                    PrivacyPolicyStatic.route, TermsOfServiceStatic.route, Settings.route -> slideOutOfContainer(
                        AnimatedContentScope.SlideDirection.Right,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                    else -> fadeOut(tween(NAV_ANIMATION_DURATION))
                }
            }
            VerifiedCustomerForm, Support -> {
                when (targetRoute) {
                    Settings.route -> slideOutOfContainer(
                        AnimatedContentScope.SlideDirection.Right,
                        animationSpec = tween(NAV_ANIMATION_DURATION)
                    )
                    else -> fadeOut(tween(NAV_ANIMATION_DURATION))
                }
            }
            SplashScreen, Settings -> {
                fadeOut(tween(NAV_ANIMATION_DURATION))
            }
            else -> slideOutOfContainer(
                AnimatedContentScope.SlideDirection.Right,
                animationSpec = tween(NAV_ANIMATION_DURATION)
            )
        }
    }

    companion object {
        fun title(routeName: String): String? {
            return Route::route.find(routeName)?.getTitle()
        }
    }
}

sealed class BottomNavDestination(val route: String) {
    class CreateExpenseAgreement(@StringRes override val resourceId: Int, override val icon: AppIcon) :
        BottomNavDestination(
            Route.CreateAgreement.route
        ),
        BottomNavigationScreen
    class ManageAgreements(@StringRes override val resourceId: Int, override val icon: AppIcon) :
        BottomNavDestination(
            Route.ManageAgreements.route
        ),
        BottomNavigationScreen
    class ViewTransactions(@StringRes override val resourceId: Int, override val icon: AppIcon) :
        BottomNavDestination(
            Route.ViewTransactions.route
        ),
        BottomNavigationScreen
}
