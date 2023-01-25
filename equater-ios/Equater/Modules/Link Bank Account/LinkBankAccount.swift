//
//  LinkBankAccount.swift
//  Equater
//
//  Created by Robert B. Menke on 5/23/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Introspect
import LinkKit
import Resolver
import SwiftUI

enum PlaidLinkType {
	case depository
	case creditAndDepository
}

struct LinkBankAccount: View {
	let title: String
	/// Subtitle if applicable for all cases other than account updates
	var subtitle: String?
	/// When a user is agreeing to share an expense, give them the ability to "remember their selection"
	/// so that they don't have to specify which account they'd like to pay with every time they accept
	/// an agreement
	var showRememberSelectionWhenRelevant = false
	let accountType: PlaidLinkType
	let onAccountSelected: (UserAccount) -> Void

	@InjectedObject var viewModel: PlaidViewModel
	@InjectedObject var appState: AppState
	@Injected var environmentService: EnvironmentService

	@State private var handler: LinkKit.Handler?
	@State private var vc: UIViewController?
	@State private var rememberSelection = false

	var body: some View {
		let accounts = getAccounts()

		return Window {
			if accounts.count == 0 {
				LinkWithoutExistingAccounts
			} else {
				LinkWithAccountList
			}
		}
		.introspectViewController(customize: { controller in
			vc = controller
		})
		.onAppear {
			let token = getToken()
			// Plaid recommends setting up the configuration ahead of time to improve loading time
			let config = PlaidConfiguration(token ?? "") { result in
				switch result {
				case .success(let plaidResponse):
					self.viewModel.persistPlaidLinkResponse(plaidLinkResponse: plaidResponse) { account in
						onAccountSelected(account)
					}
				case .error(let error):
					self.handleError(error)
				}
			}

			if let handler = config.makePlaidHandler() {
				self.handler = handler
			}
		}
		.onChange(of: appState.plaidOAuthRedirectUri) { newValue in
			if let handler = self.handler, let uri = newValue {
				handler.continue(from: uri)
			}
		}
	}

	var LinkWithoutExistingAccounts: some View {
		VStack(alignment: .center) {
			Spacer()
			AppImage
				.wallet
				.image
				.resizable()
				.frameFillWidth(height: nil)
				.padding([.leading, .trailing], 48)
				.aspectRatio(contentMode: .fit)

			AppText(title, font: .title)
				.multilineTextAlignment(.leading)
				.padding([.top, .bottom], 8)

			if let subtitle = subtitle {
				AppText(subtitle, font: .custom(size: 15, color: .textSecondary))
					.frameFillWidth(height: nil)
					.multilineTextAlignment(.leading)
					.lineLimit(4)
					.lineSpacing(3)
					.offset(y: -6)
					.padding(.bottom, 12)
			}

			makeSubmitButton("Link Account")

			Spacer()
		}
		.frameFillParent()
		.padding(15)
	}

	var LinkWithAccountList: some View {
		VStack(alignment: .center) {
			ZStack {
				VStack {
					VStack {
						AppText(title, font: .title)
							.frameFillWidth(height: nil)
							.multilineTextAlignment(.leading)

						if let subtitle = subtitle {
							AppText(subtitle, font: .custom(size: 15, color: .textSecondary))
								.frameFillWidth(height: nil)
								.multilineTextAlignment(.leading)
								.lineLimit(4)
								.lineSpacing(3)
								.padding(.top, 8)
						}

						if showRememberSelectionWhenRelevant {
							RememberSelection
								.padding([.top, .bottom], 16)
						}
					}
					.padding(.top, 40)
					.padding(.bottom, 24)

					AccountsList(rememberSelection: $rememberSelection, onAccountSelected: onAccountSelected, accountType: accountType)

					Spacer()
				}
				.padding(.bottom, 120)

				VStack {
					Spacer()
					makeSubmitButton("Add Another Account")
				}
				.frameFillParent()
			}
		}
		.frameFillParent()
		.padding(15)
	}

	var RememberSelection: some View {
		HStack {
			Toggle("Remember my choice", isOn: $rememberSelection).labelsHidden()
			AppText("Remember my choice (don’t ask again)", font: .custom(size: 16, color: .textPrimary))
				.onTapGesture {
					withAnimation {
						rememberSelection = !rememberSelection
					}
				}
			Spacer()
		}
		.frameFillWidth(height: nil)
	}

	private func getToken() -> String? {
		switch accountType {
		case .depository:
			return appState.user?.getDepositoryToken()
		case .creditAndDepository:
			return appState.user?.getCreditAndDepositoryToken()
		}
	}

	private func makeSubmitButton(_ title: String) -> some View {
		ContainedButton(
			label: title,
			enabled: true,
			size: .custom(width: .infinity, height: 50),
			isLoading: $viewModel.plaidPatchRequestInProgress,
			onTap: {
				if !viewModel.plaidPatchRequestInProgress, let vc = vc, let handler = handler {
					handler.open(presentUsing: .viewController(vc))
				}
			}
		)
		.padding(.bottom, 48)
	}

	private func handleError(_ error: AppError) {
		logger.error("Error in sheet callback \(error.localizedDescription)")
		showSnackbar(message: error.localizedDescription)
	}

	private func getAccounts() -> [UserAccount] {
		appState.userAccounts.filter { account in
			switch accountType {
			case .depository:
				return account.accountType == "depository"
			case .creditAndDepository:
				return account.accountType == "depository" || account.accountType == "credit"
			}
		}
	}
}

/// Scroll view that shows a list of accounts conforming to a particular [PlaidLinkType]
struct AccountsList: View {
	@InjectedObject private var appState: AppState
	@InjectedObject private var agreementsViewModel: AgreementsViewModel
	@Binding var rememberSelection: Bool
	let onAccountSelected: (UserAccount) -> Void
	let accountType: PlaidLinkType

	var body: some View {
		ScrollView {
			VStack(spacing: 10) {
				ForEach(getAccounts()) { account in
					BankAccountCard(account: account) { account in
						if rememberSelection, let user = appState.user {
							UserDefaults.standard.set(account.id, forKey: "\(DEFAULT_PAYMENT_ACCOUNT_ID_KEY)-\(user.id)")
							agreementsViewModel.paymentAccountId = account.id
						}

						onAccountSelected(account)
					}
				}
			}
		}
	}

	private func getAccounts() -> [UserAccount] {
		appState.userAccounts.filter { account in
			switch accountType {
			case .depository:
				return account.accountType == "depository"
			case .creditAndDepository:
				return account.accountType == "depository" || account.accountType == "credit"
			}
		}
	}
}

struct BankAccountUpdate: View {
	let account: UserAccount
	let onUpdateSuccessful: (UserAccount) -> Void

	@InjectedObject var viewModel: PlaidViewModel
	@InjectedObject var appState: AppState
	@Injected var environmentService: EnvironmentService

	@State private var handler: LinkKit.Handler?
	@State private var vc: UIViewController?

	var body: some View {
		Window {
			VStack(alignment: .center) {
				Spacer()

				AppImage
					.wallet
					.image
					.resizable()
					.frameFillWidth(height: nil)
					.padding([.leading, .trailing], 48)
					.aspectRatio(contentMode: .fit)

				AppText("Bank Login Required", font: .title)
					.multilineTextAlignment(.center)
					.padding(.top, 8)

				AppText("\(account.institutionName) has asked that you verify your login information again so that we can continue serving you.", font: .subtitle)
					.multilineTextAlignment(.leading)
					.lineSpacing(2)
					.offset(y: 4)

				ContainedButton(
					label: "Link Account",
					enabled: true,
					size: .custom(width: .infinity, height: 50),
					isLoading: self.$viewModel.plaidPatchRequestInProgress,
					onTap: {
						if !self.viewModel.plaidPatchRequestInProgress, let vc = vc, let handler = handler {
							handler.open(presentUsing: .viewController(vc))
						}
					}
				)
				.padding(.top, 8)

				Spacer()
			}
			.frameFillParent()
			.padding(15)
		}
		.introspectViewController(customize: { controller in
			vc = controller
		})
		.onAppear {
			guard let linkToken = account.getItemUpdateToken() else { return }
			// Plaid recommends setting up the configuration ahead of time to improve loading time
			let config = PlaidUpdateConfiguration(linkToken.plaidLinkToken) { result in
				switch result {
				case .success:
					self.viewModel.handleAccountUpdate(account)
					onUpdateSuccessful(account)
				case .error(let error):
					self.handleError(error)
				}
			}

			if let handler = config.makePlaidHandler() {
				self.handler = handler
			}
		}
		.onChange(of: appState.plaidOAuthRedirectUri) { newValue in
			if let handler = self.handler, let uri = newValue {
				handler.continue(from: uri)
			}
		}
	}

	private func handleError(_ error: AppError) {
		logger.error("Error in sheet callback \(error.localizedDescription)")
		showSnackbar(message: error.localizedDescription)
	}
}

struct LinkBankAccount_Previews: PreviewProvider {
	static var previews: some View {
		LinkBankAccount(
			title: "Which card do you use to pay for Netflix?",
			accountType: .creditAndDepository
		) { account in
			print(account)
		}
	}
}

struct BankAccountUpdate_Previews: PreviewProvider {
	static var previews: some View {
		BankAccountUpdate(account: userAccountFake) { _ in
		}
	}
}
