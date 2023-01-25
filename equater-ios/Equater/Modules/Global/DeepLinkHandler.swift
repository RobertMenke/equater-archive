//
//  DeepLinkHandler.swift
//  Equater
//
//  Created by Robert B. Menke on 8/16/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation
import Resolver
import UserNotifications

class DeepLinkHandler {
	@InjectedObject private var homeScreenViewModel: HomeScreenViewModel
	@InjectedObject private var agreementViewModel: AgreementsViewModel
	@InjectedObject private var transactionViewModel: TransactionViewModel
	@InjectedObject private var authViewModel: AuthenticationViewModel
	@InjectedObject private var appState: AppState

	/// Navigate based on a user's interaction with a web link
	func navigate(usingPath path: String, withRedirectUri uri: URL) {
		let pathComponents = path.split(separator: "/")
		if pathComponents.contains("transaction") {
			if let id = pathComponents.last, let transactionId = UInt(id) {
				homeScreenViewModel.currentScreen = .transactionHistory
				homeScreenViewModel.setTab(.viewTransactions)
				transactionViewModel.setLinkedTransaction(byId: transactionId)
			}
		} else if pathComponents.contains("agreement") {
			if let id = pathComponents.last, let sharedExpenseId = UInt(id) {
				homeScreenViewModel.currentScreen = .manageAgreements
				homeScreenViewModel.setTab(.manageAgreements)
				agreementViewModel.setLinkedAgreement(bySharedExpenseId: sharedExpenseId)
			}
		} else if pathComponents.contains("verify-identity") {
			homeScreenViewModel.currentScreen = .identityVerification
		} else if pathComponents.contains("oauth-redirect") {
			appState.set(plaidRedirectUri: uri)
		} else {
			homeScreenViewModel.currentScreen = .createAgreement
			print("Unhandled web link")
		}
	}

	/// Navigate based on a user's interaction with a push notification
	func navigate(usingNotification response: UNNotificationResponse, completionHandler: @escaping () -> Void) {
		let userInfo = response.notification.request.content.userInfo
		guard let category = PushNotificationCategory(rawValue: response.notification.request.content.categoryIdentifier) else {
			completionHandler()
			return
		}

		logger.debug("Responding to push notification category \(category.rawValue)")

		switch category {
		case .expenseAgreement:
			if let sharedExpenseId = userInfo["sharedExpenseId"] as? String,
			   let expenseId = UInt(sharedExpenseId)
			{
				homeScreenViewModel.currentScreen = .manageAgreements
				homeScreenViewModel.setTab(.manageAgreements)
				agreementViewModel.setLinkedAgreement(bySharedExpenseId: expenseId)
			}
		case .expenseTransaction:
			if let expenseTransactionId = userInfo["sharedExpenseTransactionId"] as? String,
			   let transactionId = UInt(expenseTransactionId)
			{
				homeScreenViewModel.currentScreen = .transactionHistory
				homeScreenViewModel.setTab(.viewTransactions)
				transactionViewModel.setLinkedTransaction(byId: transactionId)
			}
		case .identityVerification:
			homeScreenViewModel.currentScreen = .identityVerification
		case .notification:
			break
		case .plaidAuthentication:
			if appState.isSignedIn() {
				authViewModel.syncUserState()
			}
		}

		completionHandler()
	}
}
