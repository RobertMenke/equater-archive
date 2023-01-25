//
//  TabViewPreview.swift
//  Equater
//
//  Created by Robert B. Menke on 7/4/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

private enum DemoTab: String, CaseIterable {
	case createAgreement
	case manageAgreements
	case viewTransactions

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
		Text(rawValue).typeErased
	}

	static func getTabItems() -> [TabItem] {
		DemoTab.allCases.map { item in
			TabItem(
				tag: item.rawValue,
				image: item.getImage(),
				title: item.getTitle(),
				createContent: { item.getContent() }
			)
		}
	}
}

struct TabViewPreview: View {
	let tabs = DemoTab.getTabItems()
	@State var selection = DemoTab.createAgreement.rawValue
	@State private var currentPage = 0

	var body: some View {
		AppTabView(tabs: tabs, currentPage: $currentPage, selection: $selection)
	}
}

struct TabViewPreview_Previews: PreviewProvider {
	static var previews: some View {
		TabViewPreview()
	}
}
