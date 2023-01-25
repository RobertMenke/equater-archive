//
//  MerchantContributionSelection.swift
//  Equater
//
//  Created by Robert B. Menke on 6/11/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

enum ContributionType: String, CaseIterable {
	case splitEvenly = "Split Evenly"
	case percentage = "Percentage"
	case fixedAmount = "Fixed"

	static var defaultButtons: [RadioButtonModel] {
		ContributionType.allCases.map {
			RadioButtonModel(
				title: $0.rawValue,
				isSelected: $0.rawValue == ContributionType.splitEvenly.rawValue,
				badgeWithCount: 0
			)
		}
	}
}

struct MerchantContributionSelection: View {
	@InjectedObject private var appState: AppState
	@InjectedObject private var viewModel: MerchantExpenseViewModel
	@State private var options = ContributionType.defaultButtons
	@State private var selection: ContributionType = .splitEvenly

	/// Should only be called when the contribution values have been validated
	var onContinue: () -> Void

	var body: some View {
		Window {
			HeaderWithContentLayout(
				headerHeight: 144,
				header: self.Header,
				content: VStack {
					TabbedRadioButtons(buttons: self.options) {
						if let selection = ContributionType(rawValue: $0.title) {
							self.selection = selection
							self.options = ContributionType.allCases.map {
								RadioButtonModel(
									title: $0.rawValue,
									isSelected: $0 == selection,
									badgeWithCount: 0
								)
							}
						}
					}
					.padding([.leading, .trailing], 16)

					ScrollView {
						VStack {
							VStack(spacing: 10) {
								if let user = appState.user {
									self.createExpenseOwnerCard(user: user)
								}

								ForEach(self.viewModel.getUsers(), id: \.self) { user in
									self.createCard(forUser: user)
								}

								ForEach(self.viewModel.getEmails(), id: \.self) { email in
									self.createCard(forEmail: email)
								}
							}
							.padding([.leading, .trailing], 16)
							.padding(.bottom, 32)

							ContainedButton(
								label: "Done",
								enabled: true,
								size: .custom(width: .infinity, height: 50),
								isLoading: .constant(false),
								onTap: {
									self.done()
								}
							)
							.frame(height: 50)
							.padding([.leading, .trailing], 16)
						}
						.padding(.top, 16)
					}
				}
			)
		}
	}

	var Header: some View {
		VStack {
			HStack {
				Spacer()
				Button(
					action: {
						self.done()
					},
					label: {
						Text("Done").bold()
					}
				)
				.foregroundColor(AppColor.accentPrimaryForText.color)
			}
			.frameFillWidth(height: 72, alignment: .bottom)
			.padding(.trailing, 16)

			HStack(alignment: .bottom) {
				AppText("Split It Up", font: .jumbo)
				Spacer()
			}
			.frameFillWidth(height: 72, alignment: .center)
			.padding(.leading, 16)
		}
	}

	private func createCard(forUser user: User) -> some View {
		switch selection {
		case .splitEvenly:
			return ExpenseContributionUserCard.splitEvenly(user: .right(user)).cardView
		case .percentage:
			return ExpenseContributionUserCard.percentage(user: .right(user)).cardView
		case .fixedAmount:
			return ExpenseContributionUserCard.fixedAmount(user: .right(user)).cardView
		}
	}

	private func createCard(forEmail email: String) -> some View {
		switch selection {
		case .splitEvenly:
			return ExpenseContributionUserCard.splitEvenly(user: .left(email)).cardView
		case .percentage:
			return ExpenseContributionUserCard.percentage(user: .left(email)).cardView
		case .fixedAmount:
			return ExpenseContributionUserCard.fixedAmount(user: .left(email)).cardView
		}
	}

	private func createExpenseOwnerCard(user: User) -> some View {
		switch selection {
		case .splitEvenly:
			return ExpenseContributionOwnerCard.splitEvenly(user: user).cardView
		case .percentage:
			return ExpenseContributionOwnerCard.percentage(user: user).cardView
		case .fixedAmount:
			return ExpenseContributionOwnerCard.fixedAmount(user: user).cardView
		}
	}

	private func done() {
		if let error = viewModel.findError() {
			showSnackbar(message: error)
		} else {
			onContinue()
		}
	}
}

struct MerchantContributionSelection_Previews: PreviewProvider {
	static var previews: some View {
		MerchantContributionSelection {
			print("on continue")
		}
	}
}
