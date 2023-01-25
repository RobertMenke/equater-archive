//
//  AccountDetailView.swift
//  Equater
//
//  Created by Robert B. Menke on 8/13/22.
//  Copyright © 2022 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct AccountDetailView: View {
	@Environment(\.presentationMode) var presentationMode
	@InjectedObject private var agreementsViewModel: AgreementsViewModel
	@InjectedObject private var homeScreenViewModel: HomeScreenViewModel
	@InjectedObject private var plaidViewModel: PlaidViewModel
	let account: UserAccount
	@State private var isLoading = false
	@State private var selection: UInt? = nil

	var body: some View {
		Window {
			Header
			Divider()
			VStack {
				ActiveAgreementsWithCard
				UnlinkCard
			}
			.frameFillParent()
			.padding([.leading, .trailing], 14)
		}
		.offset(y: 1.0)
		.navigationTitle("Account Detail")
	}

	var Header: some View {
		HStack(alignment: .center) {
			Spacer()

			VStack(alignment: .center) {
				Spacer()

				RemoteImage(photo: .plaidInstitution(institution: account.institution)) {
					AppImage.wallet.image.resizable()
				}
				.aspectRatio(contentMode: .fit)
				.frame(width: 80, height: 80)

				VStack(alignment: .center, spacing: 4) {
					AppText(account.institutionName, font: .custom(size: 22.0, color: .textPrimary))
						.bold()
						.padding(.leading, 4)
						.lineLimit(1)

					AppText(account.accountName, font: .custom(size: 15.0, color: .textSecondary))
				}

				Spacer()
			}

			Spacer()
		}
		.frameFillWidth(height: 150)
		.padding(.all, 8)
	}

	var ActiveAgreementsWithCard: some View {
		let agreements = agreementsViewModel.getActiveSharedExpensesForAccount(account: account)

		return Group {
			if agreements.count == 0 {
				NoActiveAgreementsUsingCard
			} else {
				ActiveAgreementsUsingCard(agreements: agreements)
			}
		}
	}

	var NoActiveAgreementsUsingCard: some View {
		HStack(alignment: .center) {
			Spacer()
			AppText("No active agreements using account", font: .primaryText)
				.multilineTextAlignment(.center)
			Spacer()
		}
		.frameFillParent(alignment: .center)
	}

	var UnlinkCard: some View {
		let agreements = agreementsViewModel.getActiveSharedExpensesForAccount(account: account)

		return SlideToConfirm(
			slideInstructionText: "Swipe to Unlink Account",
			slideCompletedText: "Account Removed",
			isLoading: $isLoading,
			completion: { handler in
				if agreements.count > 0 {
					handler.setCompletionState(false)
					showActiveAgreementsRemainingAlert()
				} else {
					isLoading = true
					plaidViewModel.unlinkBankAccount(account) { didSucceed in
						isLoading = false
						if didSucceed {
							presentationMode.wrappedValue.dismiss()
							showSnackbar(message: "\(account.accountName) has been removed from Equater")
						} else {
							handler.setCompletionState(false)
						}
					}
				}
			}
		)
		.padding(.bottom, 50)
	}

	private func ActiveAgreementsUsingCard(agreements: [SharedExpenseStory]) -> some View {
		VStack {
			HStack {
				AppText("Agreements Using Account", font: .custom(size: 16, color: .textPrimary)).bold()
				Spacer()
			}

			ScrollView {
				VStack(spacing: 10) {
					ForEach(agreements) { agreement in
						NavigationLink(
							destination: AgreementDetailView(story: agreement, allowNavigationActions: false),
							tag: agreement.sharedExpense.id,
							selection: self.$selection,
							label: { EmptyView() }
						)
						.hidden()
						ExpenseAgreement(story: agreement) {
							selection = agreement.sharedExpense.id
						}
					}
				}
			}
		}
		.frameFillParent()
	}

	private func showActiveAgreementsRemainingAlert() {
		let alertController = UIAlertController(title: "Cancel Agreements First", message: "In order to unlink your account cancel any active agreements you have using the account.", preferredStyle: .alert)

		alertController.addAction(UIAlertAction(title: "Ok", style: .default, handler: { (_: UIAlertAction!) in
			alertController.dismiss(animated: true)
		}))

		if let viewController = UIApplication.shared.windows.first?.rootViewController {
			viewController.present(alertController, animated: true)
		}
	}
}

struct AccountDetailView_Previews: PreviewProvider {
	static var previews: some View {
		AccountDetailView(account: userAccountFake)
	}
}
