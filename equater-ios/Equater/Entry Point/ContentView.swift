//
//  ContentView.swift
//  Equater
//
//  Created by Robert B. Menke on 8/18/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftEventBus
import SwiftUI

struct ContentView: View {
	@InjectedObject var appState: AppState
	@InjectedObject var authViewModel: AuthenticationViewModel
	@InjectedObject var onBoardingViewModel: OnBoardingViewModel
	@InjectedObject var agreementsViewModel: AgreementsViewModel
	@InjectedObject var homeScreenViewModel: HomeScreenViewModel

	var body: some View {
		//        DesignPreview()
		Group {
			if self.appState.isSignedIn(), let user = self.appState.user {
				if !self.hasCompletedProfile() {
					Profile(
						user: user,
						showFormInstructions: true,
						onSaveSuccessful: {
							// If a user is signing up after being invited we automatically fetch their agreements
							// on sign-in, however, we don't have their name yet at that point so their profile
							// pic would just show an empty avatar. Re-fetch agreements here to ensure we at least
							// show initials on any avatar.
							if agreementsViewModel.sharedExpenses.count > 0 {
								agreementsViewModel.fetchSharedExpenses()
							}
						}
					)
					.transition(.slideIn)
					.onAppear {
						DispatchQueue.global(qos: .default).async {
							logger.info("User during registration reached profile screen")
						}
					}
				} else if !user.canReceiveFunds {
					Window {
						VerifiedCustomerForm {}
							.padding(.top, 100)
					}
					.transition(.slideIn)
					.onAppear {
						DispatchQueue.global(qos: .default).async {
							logger.info("User during registration reached dwolla customer verification screen")
						}
					}
				} else if appState.shouldAskUserToOptInToPushNotifications(), !onBoardingViewModel.hasSeenNotificationPrompt {
					EnableNotifications { _ in
						withAnimation {
							onBoardingViewModel.set(hasSeenNotificationPrompt: true)
						}
					}
					.transition(.slideIn)
					.onAppear {
						DispatchQueue.global(qos: .default).async {
							logger.info("User during registration reached enable notification screen")
						}
					}
				} else if !authViewModel.acceptedTermsOfService {
					TermsOfServiceAcceptance(viewModel: authViewModel)
						.transition(.slideIn)
						.onAppear {
							DispatchQueue.global(qos: .default).async {
								logger.info("User during registration reached terms of service acceptance")
							}
						}
				} else if !authViewModel.acceptedPrivacyPolicy {
					PrivacyPolicyAcceptance(viewModel: authViewModel)
						.transition(.slideIn)
						.onAppear {
							onBoardingViewModel.showConfettiAnimation = true
							DispatchQueue.global(qos: .default).async {
								logger.info("User during registration reached privacy policy acceptance screen")
							}
						}
				} else if !onBoardingViewModel.hasSeenOnBoarding, !agreementsViewModel.hasInvitation() {
					OnBoardingIntroQuestion()
						.transition(.slideIn)
						.onAppear {
							DispatchQueue.global(qos: .default).async {
								logger.info("User during registration reached on boarding intro question screen")
							}
						}
				} else {
					HomeScreen(user: user)
						.transition(.slideIn)
						.onAppear {
							if agreementsViewModel.hasInvitation() {
								homeScreenViewModel.setTab(.manageAgreements)
								agreementsViewModel.setSelectedTab(.pending)
								// Don't show on-boarding again if we skip it on initial sign-up
								onBoardingViewModel.set(hasSeenOnBoarding: true)
							}
						}
				}
			} else {
				WelcomeToEquater()
					.transition(.slideIn)
			}
		}
		.onAppear {
			if appState.shouldAuthWithFaceId, appState.isSignedIn(), let user = appState.user {
				appState.shouldAuthWithFaceId = false
				let localAuthService = LocalAuthenticationService()
				localAuthService.authenticate {
					switch $0 {
					case .loggedIn:
						// If the user is already logged in, sync the user state with the server. For example, we may
						// need to re-authenticate with Plaid
						DispatchQueue.global(qos: .default).async {
							self.authViewModel.syncUserState()
						}
						SwiftEventBus.post(Event.userIsSignedIn.rawValue)
						logger.addAttribute(forKey: "userId", value: user.id)
					case .loggedOut:
						self.appState.signOut()
						self.authViewModel.authFlowIsActive = true
						self.authViewModel.authFlow = .signIn
						logger.removeAttribute(forKey: "userId")
					}
				}
			}
		}
	}

	private func hasCompletedProfile() -> Bool {
		guard let firstName = appState.user?.firstName, let lastName = appState.user?.lastName else {
			return false
		}

		return !firstName.isEmpty && !lastName.isEmpty
	}
}

#if DEBUG
	struct ContentView_Previews: PreviewProvider {
		static var previews: some View {
			ContentView()
		}
	}
#endif
