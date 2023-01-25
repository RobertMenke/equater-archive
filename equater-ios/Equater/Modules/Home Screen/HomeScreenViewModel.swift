//
//  HomeScreenViewModel.swift
//  Equater
//
//  Created by Robert B. Menke on 5/25/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation
import Resolver
import SwiftUI

enum HomeScreenTab: String, CaseIterable {
	case createAgreement
	case manageAgreements
	case viewTransactions

	static func fromIndex(_ i: Int) -> HomeScreenTab {
		allCases.first { $0.getIndex() == i } ?? .createAgreement
	}

	func getIndex() -> Int {
		switch self {
		case .createAgreement:
			return 0
		case .manageAgreements:
			return 1
		case .viewTransactions:
			return 2
		}
	}

	func getImage() -> AppImage {
		switch self {
		case .createAgreement:
			return .write
		case .manageAgreements:
			return .weightScale
		case .viewTransactions:
			return .creditCard
		}
	}

	func getTitle() -> String {
		switch self {
		case .createAgreement:
			return "Create"
		case .manageAgreements:
			return "Agreements"
		case .viewTransactions:
			return "Transactions"
		}
	}

	func getContent() -> AnyView {
		switch self {
		case .createAgreement:
			return SharedExpenseWizard().typeErased
		case .manageAgreements:
			return ExpenseAgreementList().typeErased
		case .viewTransactions:
			return TransactionView().typeErased
		}
	}

	static func getTabItems() -> [TabItem] {
		Self.allCases.map { item in
			TabItem(
				tag: item.rawValue,
				image: item.getImage(),
				title: item.getTitle(),
				createContent: { item.getContent() }
			)
		}
	}
}

final class HomeScreenViewModel: Identifiable, ObservableObject {
	@Published var currentScreen = HomeScreenNavigation.fromDefaults()
	@Published var selectedTab: String = HomeScreenTab.createAgreement.rawValue
	@Published var currentPage = 0
	@Published var navLinkSelection: String? = nil
	@Published var selectedAgreementStory: SharedExpenseStory? = nil
	@Published var selectedTransactionStory: TransactionStory? = nil

	func setTab(_ tab: HomeScreenTab) {
		selectedTab = tab.rawValue
		currentPage = tab.getIndex()
		currentScreen = HomeScreenNavigation.fromTab(tab)
	}
}
