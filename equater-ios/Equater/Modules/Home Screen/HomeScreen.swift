//
//  HomeScreen.swift
//  Equater
//
//  Created by Robert B. Menke on 5/24/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct HomeScreen: View {
	@InjectedObject private var appState: AppState
	@InjectedObject private var viewModel: HomeScreenViewModel
	var user: User

	var body: some View {
		Group {
			if viewModel.currentScreen == .createAgreement {
				HomeScreenTabView()
			} else if viewModel.currentScreen == .manageAgreements {
				HomeScreenTabView()
			} else if viewModel.currentScreen == .transactionHistory {
				HomeScreenTabView()
			} else if viewModel.currentScreen == .settings {
				if let user = appState.user {
					SettingsView(user: user)
				}
			} else if viewModel.currentScreen == .identityVerification {
				VerifiedCustomerForm {
					print("Form updated")
				}
			} else if viewModel.currentScreen == .support {
				Support()
			}
		}
		.navDrawer(currentScreen: self.$viewModel.currentScreen, user: user)
		.sheet(isPresented: $appState.showHomeScreenSheet) {
			if let account = appState.findAccountRequiringUpdate() {
				BankAccountUpdate(account: account) { updatedAccount in
					var acct = updatedAccount
					acct.requiresPlaidReAuthentication = false
					appState.set(userAccount: acct)
					// If the user should also register for remote notifications, keep the sheet open
					if !appState.shouldAskUserToOptInToPushNotifications() {
						appState.showHomeScreenSheet = appState.findAccountRequiringUpdate() != nil
					}
				}
				.transition(.slideIn)
			} else if appState.shouldAskUserToOptInToPushNotifications() {
				EnableNotifications { _ in
				}
				.transition(.slideIn)
			} else {
				EmptyView().onAppear {
					// When no case is matched, dismiss the modal (should never happen and always represents a bug)
					logger.error("NO CASE MATCHED IN HOME SCREEN SHEET. THIS IS A BUG.")
					appState.showHomeScreenSheet = false
				}
			}
		}
	}
}

struct HomeScreen_Previews: PreviewProvider {
	static var previews: some View {
		HomeScreen(user: userFake)
	}
}
