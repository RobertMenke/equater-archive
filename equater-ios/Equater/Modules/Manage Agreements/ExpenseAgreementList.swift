//
//  ManageExpenses.swift
//  Equater
//
//  Created by Robert B. Menke on 5/24/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Introspect
import Resolver
import SwiftUI

enum ExpenseAgreementTab: String, CaseIterable {
	case active = "Active"
	case pending = "Pending"
	case inactive = "Canceled"

	static func getButtons(withActiveTab tab: ExpenseAgreementTab, numberOfInvitations: UInt) -> [RadioButtonModel] {
		ExpenseAgreementTab.allCases.map {
			RadioButtonModel(
				title: $0.rawValue,
				isSelected: $0 == tab,
				badgeWithCount: $0 == .pending ? numberOfInvitations : 0
			)
		}
	}
}

struct ExpenseAgreementList: View {
	@InjectedObject private var appState: AppState
	@InjectedObject private var viewModel: AgreementsViewModel
	@InjectedObject private var accountViewModel: PlaidViewModel
	@State var loading = false

	var body: some View {
		GeometryReader { (_: GeometryProxy) in
			Window {
				VStack {
					TabbedRadioButtons(buttons: self.viewModel.tabs) {
						if let selection = ExpenseAgreementTab(rawValue: $0.title) {
							self.viewModel.setSelectedTab(selection)
						}
					}
					.padding([.leading, .trailing], 16)

					if self.viewModel.hasFetchedInitialData {
						AgreementList
					} else {
						ActivityIndicator(isAnimating: .constant(true), style: .large)
							.frameFillWidth(height: 300, alignment: .center)
					}
				}
				.padding(.top, 8)
			}
			.sheet(
				isPresented: self.$viewModel.showSheet,
				onDismiss: {
					DispatchQueue.main.async {
						viewModel.onAccountLinked = nil
					}
				}
			) {
				if !viewModel.hasPaymentAccount(), viewModel.agreementAction == .accept {
					LinkBankAccount(
						title: "Which account would you like to use for payment?",
						showRememberSelectionWhenRelevant: true,
						accountType: .depository,
						onAccountSelected: { account in
							viewModel.setPaymentAccount(paymentAccountId: account.id)
							// Optimistically update the UI. Animate the email confirmation modal if it's to be shown.
							if let user = appState.user, user.emailIsConfirmed {
								viewModel.showSheet = false
								appState.set(userAccount: account)
							} else {
								viewModel.showSheet = false
								withAnimation {
									appState.set(userAccount: account)
								}
							}

							viewModel.onAccountLinked?(account.id)
							viewModel.onAccountLinked = nil
						}
					)
					.transition(.slideIn)
				} else if let user = appState.user {
					if !user.emailIsConfirmed {
						EmailVerification {
							self.viewModel.showSheet = false
						}
						.transition(.slideIn)
					}
				} else {
					EmptyView().onAppear {
						// When no case is matched, dismiss the modal (should never happen and always represents a bug)
						logger.error("NO CASE MATCHED IN EXPENSE AGREEMENT LIST. THIS IS A BUG.")
						viewModel.showSheet = false
					}
				}
			}
		}
	}

	var AgreementList: some View {
		ScrollView {
			if self.viewModel.selectedTab == .active {
				ActiveAgreements()
			} else if self.viewModel.selectedTab == .pending {
				PendingAgreements()
			} else if self.viewModel.selectedTab == .inactive {
				InactiveAgreements()
			}
		}
		.introspectScrollView { scrollView in
			scrollView.refreshControl = UIRefreshControl()
			scrollView.refreshControl?.addTarget(
				self.viewModel,
				action: #selector(AgreementsViewModel.handleRefresh(sender:)),
				for: .valueChanged
			)
		}
	}

	var ScrollViewBody: some View {
		Group {
			if self.viewModel.selectedTab == .active {
				ActiveAgreements()
			} else if self.viewModel.selectedTab == .pending {
				PendingAgreements()
			} else if self.viewModel.selectedTab == .inactive {
				InactiveAgreements()
			}
		}
	}
}

private struct ActiveAgreements: View {
	@InjectedObject private var viewModel: AgreementsViewModel
	@InjectedObject private var navigation: HomeScreenViewModel

	var body: some View {
		let stories = self.viewModel.getSharedExpenses(withStatus: .active)
		return Group {
			if stories.count > 0 {
				Section("Active Agreements") {
					VStack(spacing: 10) {
						ForEach(stories) { story in
							ExpenseAgreement(story: story) {
								performNavigation(story)
							}
						}
					}
					.padding([.leading, .trailing], 1)
				}
				.frameFillParent()
				.padding(.top, 16)
				.padding([.leading, .trailing], 16)
			} else {
				VStack {
					NoDataFound(text: "No active agreements found")
					ContainedButton(
						label: "Create one now!",
						enabled: true,
						size: .custom(width: .infinity, height: 50),
						image: nil,
						isLoading: .constant(false),
						onTap: {
							navigation.setTab(.createAgreement)
						}
					)
					Spacer()
				}
				.frameFillParent(alignment: .center)
				.padding([.leading, .trailing], 16)
			}
		}
	}

	private func performNavigation(_ story: SharedExpenseStory) {
		navigation.selectedAgreementStory = story
		DispatchQueue.main.async {
			navigation.navLinkSelection = "expense-agreement"
		}
	}
}

private struct PendingAgreements: View {
	@InjectedObject private var viewModel: AgreementsViewModel
	@InjectedObject private var navigation: HomeScreenViewModel

	var body: some View {
		let invitations = self.viewModel.getInvitations()
		let pendingAgreements = self.viewModel.getPendingAgreementsWithoutInvitation()

		return Group {
			if invitations.count > 0 || pendingAgreements.count > 0 {
				if invitations.count > 0 {
					Section("Invitations") {
						VStack(spacing: 10) {
							ForEach(invitations) { story in
								ExpenseAgreement(story: story) {
									performNavigation(story)
								}
							}
						}
						.padding([.leading, .trailing], 1)
					}
					.padding(.top, 16)
					.padding([.leading, .trailing], 16)
				}

				if pendingAgreements.count > 0 {
					Section("Pending Agreements") {
						VStack(spacing: 10) {
							ForEach(pendingAgreements) { story in
								ExpenseAgreement(story: story) {
									performNavigation(story)
								}
							}
						}
						.padding([.leading, .trailing], 1)
					}
					.padding(.top, 16)
					.padding([.leading, .trailing], 16)
				}
			} else {
				NoDataFound(text: "No pending agreements found").padding([.leading, .trailing], 16)
			}
		}
	}

	private func performNavigation(_ story: SharedExpenseStory) {
		navigation.selectedAgreementStory = story
		DispatchQueue.main.async {
			navigation.navLinkSelection = "expense-agreement"
		}
	}
}

private struct InactiveAgreements: View {
	@InjectedObject private var viewModel: AgreementsViewModel
	@InjectedObject private var navigation: HomeScreenViewModel

	var body: some View {
		let stories = self.viewModel.getSharedExpenses(withStatus: .inactive)

		return Group {
			if stories.count > 0 {
				Section("Inactive Agreements") {
					VStack(spacing: 10) {
						ForEach(stories) { story in
							ExpenseAgreement(story: story) {
								performNavigation(story)
							}
						}
					}
					.padding([.leading, .trailing], 1)
				}
				.padding(.top, 16)
				.padding([.leading, .trailing], 16)
			} else {
				NoDataFound(text: "No inactive agreements found").padding([.leading, .trailing], 16)
			}
		}
	}

	private func performNavigation(_ story: SharedExpenseStory) {
		navigation.selectedAgreementStory = story
		DispatchQueue.main.async {
			navigation.navLinkSelection = "expense-agreement"
		}
	}
}

struct ExpenseAgreements_Previews: PreviewProvider {
	static var previews: some View {
		ExpenseAgreementList()
	}
}
