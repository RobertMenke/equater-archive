//
//  HomeScreenTabView.swift
//  Equater
//
//  Created by Robert B. Menke on 5/24/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct HomeScreenTabView: View {
	@InjectedObject private var viewModel: HomeScreenViewModel
	let tabs = HomeScreenTab.getTabItems()

	var body: some View {
		Group {
			// Because of some unfortunate behavior related to this NavigationView -> PagingView -> UIHostingController -> Subview
			// navigation experience we have to hoist all of our navigation links above the PagingView to ensure that they can be
			// controlled programmatically
			NavigationLink(
				destination: MerchantSharedExpense(),
				tag: SharedExpenseWizardNavigation.merchant.rawValue,
				selection: $viewModel.navLinkSelection,
				label: { EmptyView() }
			)
			.hidden()

			NavigationLink(
				destination: RecurringSharedExpense(),
				tag: SharedExpenseWizardNavigation.recurring.rawValue,
				selection: $viewModel.navLinkSelection,
				label: { EmptyView() }
			)
			.hidden()

			NavigationLink(
				destination: viewModel.selectedAgreementStory != nil
					? AgreementDetailView(story: viewModel.selectedAgreementStory!).typeErased
					: EmptyView().typeErased,
				tag: "expense-agreement",
				selection: $viewModel.navLinkSelection,
				label: { EmptyView() }
			)
			.hidden()

			NavigationLink(
				destination: MerchantSharedExpense(),
				tag: "merchant-edit-link",
				selection: $viewModel.navLinkSelection,
				label: { EmptyView() }
			)
			.hidden()

			NavigationLink(
				destination: MerchantSharedExpense(),
				tag: "recurring-edit-link",
				selection: $viewModel.navLinkSelection,
				label: { EmptyView() }
			)
			.hidden()

			NavigationLink(
				destination: viewModel.selectedTransactionStory != nil
					? TransactionDetailView(transactionStory: viewModel.selectedTransactionStory!).typeErased
					: EmptyView().typeErased,
				tag: "transaction-detail",
				selection: $viewModel.navLinkSelection,
				label: { EmptyView() }
			)
			.hidden()

			NavigationLink(
				destination: EquaterBalance(),
				tag: "equater-balance",
				selection: $viewModel.navLinkSelection,
				label: { EmptyView() }
			)
			.hidden()

			AppTabView(
				tabs: tabs,
				currentPage: self.$viewModel.currentPage,
				selection: self.$viewModel.selectedTab
			)
		}
	}
}

struct HomeScreenTabView_Previews: PreviewProvider {
	static var previews: some View {
		HomeScreenTabView()
	}
}
