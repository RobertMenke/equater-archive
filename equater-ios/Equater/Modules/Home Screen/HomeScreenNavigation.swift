//
//  HomeScreenNavigation.swift
//  Equater
//
//  Created by Robert B. Menke on 5/24/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

enum HomeScreenNavigation: String, CaseIterable {
	static var userDefaultsKey = "HomeScreenSection"

	/// The order here determines how they appear in the sidebar
	case createAgreement
	case manageAgreements
	case transactionHistory
	case settings
	case identityVerification
	case support
	case signOut

	static func fromTab(_ tab: HomeScreenTab) -> HomeScreenNavigation {
		switch tab {
		case .createAgreement:
			return .createAgreement
		case .manageAgreements:
			return .manageAgreements
		case .viewTransactions:
			return .transactionHistory
		}
	}

	func getHeaderTitle(viewModel: HomeScreenViewModel) -> String {
		switch self {
		case .createAgreement:
			guard let tab = HomeScreenTab(rawValue: viewModel.selectedTab) else {
				return "Create Agreement"
			}

			switch tab {
			case .createAgreement:
				return "Create Agreement"
			case .manageAgreements:
				return "Agreements"
			case .viewTransactions:
				return "Transactions"
			}
		case .settings:
			return "Settings"
		case .manageAgreements:
			return "Manage Agreements"
		case .transactionHistory:
			return "Transactions"
		case .identityVerification:
			return "Identity Verification"
		case .support:
			return "Support"
		case .signOut:
			return "Sign Out"
		}
	}

	func getNavTitle() -> String {
		switch self {
		case .createAgreement:
			return "Create Agreement"
		case .manageAgreements:
			return "Manage Agreements"
		case .transactionHistory:
			return "Transaction History"
		case .settings:
			return "Settings"
		case .identityVerification:
			return "Identity Verification"
		case .support:
			return "Support"
		case .signOut:
			return "Sign Out"
		}
	}

	var icon: Image {
		appImage.image
	}

	var appImage: AppImage {
		switch self {
		case .createAgreement:
			return .write
		case .manageAgreements:
			return .weightScale
		case .transactionHistory:
			return .creditCard
		case .settings:
			return .settings
		case .identityVerification:
			return .verificationCheck
		case .support:
			return .callSupport
		case .signOut:
			return .signOut
		}
	}

	/// Some strange behavior in an iOS update causes nested geometry readers to crash when rendered
	/// as the initial view. Previously, the behavior here was that we would load the last screen the user
	/// was on. The easiest fix to avoid the geometry reader crash was simply to always
	/// render the home screen on launch.
	static func fromDefaults() -> HomeScreenNavigation {
		HomeScreenNavigation.allCases.first ?? .createAgreement
	}
}
