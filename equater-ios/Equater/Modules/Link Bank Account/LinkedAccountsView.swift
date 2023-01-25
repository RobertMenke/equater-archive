//
//  LinkedAccountsView.swift
//  Equater
//
//  Created by Robert B. Menke on 8/12/22.
//  Copyright © 2022 beauchampsullivan. All rights reserved.
//

import Introspect
import LinkKit
import Resolver
import SwiftUI

/// Displays a list of linked accounts from the settings screen with options
/// to manage those accounts
struct LinkedAccountsView: View {
	@InjectedObject private var plaidViewModel: PlaidViewModel
	@InjectedObject private var appState: AppState
	@State private var handler: LinkKit.Handler?
	@State private var vc: UIViewController?
	@State private var selection: UInt? = nil

	var body: some View {
		Window {
			VStack {
				if appState.userAccounts.isEmpty {
					NoDataFound(text: "When you link bank accounts they'll show up here")
				} else {
					AccountList
				}
				Spacer()
				LinkAccountButton
					.padding(.bottom, 40)
			}
			.padding(.all, 14)
		}
		.offset(y: 1)
		.introspectViewController(customize: { controller in
			vc = controller
		})
		.navigationTitle(Text("Linked Accounts"))
		.onAppear {
			let token = appState.user?.getCreditAndDepositoryToken()
			// Plaid recommends setting up the configuration ahead of time to improve loading time
			let config = PlaidConfiguration(token ?? "") { result in
				switch result {
				case .success(let plaidResponse):
					self.plaidViewModel.persistPlaidLinkResponse(plaidLinkResponse: plaidResponse) { _ in
						print("Account list should be updated")
					}
				case .error(let error):
					self.handleError(error)
				}
			}

			if let handler = config.makePlaidHandler() {
				self.handler = handler
			}
		}
	}

	var AccountList: some View {
		ScrollView {
			VStack(spacing: 10) {
				ForEach(appState.userAccounts) { account in
					NavigationLink(
						destination: AccountDetailView(account: account),
						tag: account.id,
						selection: self.$selection,
						label: { EmptyView() }
					)
					.hidden()

					BankAccountCard(account: account, includeTrailingArrow: true) { account in
						self.selection = account.id
					}
				}
			}
		}
	}

	var LinkAccountButton: some View {
		let text = appState.userAccounts.count > 0 ? "Link Another Account" : "Link Account"

		return ContainedButton(
			label: text,
			enabled: true,
			size: .custom(width: .infinity, height: 50),
			isLoading: self.$plaidViewModel.plaidPatchRequestInProgress,
			onTap: {
				if !self.plaidViewModel.plaidPatchRequestInProgress, let vc = vc, let handler = handler {
					handler.open(presentUsing: .viewController(vc))
				}
			}
		)
		.padding(.top, 8)
	}

	private func handleError(_ error: AppError) {
		logger.error("Error in sheet callback \(error.localizedDescription)")
		showSnackbar(message: error.localizedDescription)
	}
}

struct LinkedAccountsView_Previews: PreviewProvider {
	static var previews: some View {
		LinkedAccountsView()
	}
}
