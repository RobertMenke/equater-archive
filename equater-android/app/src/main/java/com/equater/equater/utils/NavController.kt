package com.equater.equater.utils

import androidx.navigation.NavController
import com.equater.equater.authentication.UserOnBoardingState
import com.equater.equater.navigation.Route

fun NavController.onBoardingNavigation(state: UserOnBoardingState) = when (state) {
    UserOnBoardingState.SplashScreen -> navigate(Route.SplashScreen.route)
    UserOnBoardingState.ShouldRegister -> navigate(Route.WelcomeToEquater.route)
    UserOnBoardingState.ShouldCreateProfile -> navigate(Route.ProfileOnBoarding.route)
    UserOnBoardingState.ShouldVerifyIdentity -> navigate(Route.VerifiedCustomerFormOnBoarding.route)
    UserOnBoardingState.ShouldAgreeToTerms -> navigate(Route.TermsOfService.route)
    UserOnBoardingState.ShouldAgreeToPrivacyPolicy -> navigate(Route.PrivacyPolicy.route)
    UserOnBoardingState.OnBoardingCompleted -> navigate(Route.CreateAgreement.route) {
        popUpTo(graph.startDestinationId)
    }
}
