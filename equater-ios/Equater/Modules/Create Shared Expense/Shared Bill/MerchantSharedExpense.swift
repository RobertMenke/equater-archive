//
//  MerchantSharedExpense.swift
//  Equater
//
//  Created by Robert B. Menke on 5/25/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftEventBus
import SwiftUI

struct MerchantSharedExpense: View {
	@Environment(\.presentationMode) private var presentationMode: Binding<PresentationMode>
	@InjectedObject private var appState: AppState
	@InjectedObject private var navigation: HomeScreenViewModel
	@InjectedObject private var agreements: AgreementsViewModel
	@InjectedObject private var viewModel: MerchantExpenseViewModel
	@InjectedObject private var onBoardingViewModel: OnBoardingViewModel
	@State private var showActionSheet = false
	@State private var modal: MerchantSharedExpenseStep = .selectVendor
	@State private var showVerifiedCustomerSheet = false
	@State private var isLoading = false
	/// If a credit card it linked as the account to look out for we must also link a depository account
	/// So that we can handle deposits/withdrawals
	@State private var mustLinkDepositoryAccount = false

	var body: some View {
		Window {
			ZStack {
				VStack {
					ProgressStepper(currentStep: viewModel.step, items: MerchantSharedExpenseStep.allCases) { item in
						if let step = item as? MerchantSharedExpenseStep, item.getStepIndex() <= viewModel.step.getStepIndex() {
							viewModel.step = step
						}
					}
					.padding(.top, 120)
					.padding([.leading, .trailing], 28)
				}
				.frameFillParent()

				WindowContent
			}
		}
		.navigationBarTitle(TitleText)
		.sheet(
			isPresented: $viewModel.showModalContent,
			onDismiss: { self.viewModel.showEmailConfirmation = false }
		) {
			if self.viewModel.showEmailConfirmation {
				EmailVerification {
					isLoading = false
					if showVerifiedCustomerSheet {
						withAnimation {
							viewModel.showEmailConfirmation = false
							showVerifiedCustomerSheet = true
						}
					} else {
						viewModel.showModalContent = false
						viewModel.showEmailConfirmation = false
					}
				}
				.transition(.slideIn)
			} else if self.showVerifiedCustomerSheet {
				VerificationSheet.transition(.slideIn)
			} else if self.modal == .selectVendor {
				VendorSheet
			} else if self.modal == .selectUsers {
				UserSheet
			} else if self.modal == .selectSharingModel {
				MerchantContributionSelection {
					self.viewModel.showModalContent = false
					self.viewModel.step = .selectAccount
				}
			} else if mustLinkDepositoryAccount {
				LinkBankAccount(
					title: "Credit Card Detected",
					subtitle: "Since you pay for \(self.viewModel.vendor?.friendlyName ?? "") with a credit card we also need a bank account (checking/savings) on file that we can use to deposit the money your friends send you.",
					accountType: .depository,
					onAccountSelected: { account in
						mustLinkDepositoryAccount = false
						viewModel.step = .review
						viewModel.expenseOwnerDestinationAccount = account
						viewModel.showModalContent = false
					}
				)
				.transition(.slideIn)
			} else if self.modal == .selectAccount {
				LinkBankAccount(
					title: "Which account do you use to pay for \(self.viewModel.vendor?.friendlyName ?? "")?",
					accountType: .creditAndDepository
				) { account in
					self.viewModel.expenseOwnerSourceAccount = account
					if account.accountType != "depository" {
						withAnimation {
							mustLinkDepositoryAccount = true
						}
					} else {
						self.viewModel.step = .review
						self.viewModel.showModalContent = false
					}
				}
				.transition(.slideIn)
			} else {
				EmptyView().onAppear {
					// When no case is matched, dismiss the modal (should never happen and always represents a bug)
					logger.error("NO CASE MATCHED IN MERCHANT SHARED EXPENSE SHEET. THIS IS A BUG.")
					viewModel.showModalContent = false
				}
			}
		}
		.withSheet(visible: $showActionSheet) {
			MenuItem(icon: .shoppingBagIcon, text: "Edit Biller") {
				HapticEngine.shared.play(.buttonTap)
				self.modal = .selectVendor
				self.viewModel.showModalContent = true
				self.showActionSheet = false
			}

			MenuItem(icon: .profile, text: "Edit Payers") {
				HapticEngine.shared.play(.buttonTap)
				self.modal = .selectUsers
				self.viewModel.showModalContent = true
				self.showActionSheet = false
			}

			if viewModel.step != .selectSharingModel {
				MenuItem(icon: .walletIcon, text: "Edit Amounts") {
					HapticEngine.shared.play(.buttonTap)
					self.modal = .selectSharingModel
					self.viewModel.showModalContent = true
					self.showActionSheet = false
				}
			}

			if viewModel.step == .review {
				MenuItem(icon: .moneyTransfer, text: "Edit Account") {
					HapticEngine.shared.play(.buttonTap)
					self.modal = .selectAccount
					self.viewModel.showModalContent = true
					self.showActionSheet = false
				}
			}
		}
	}

	private var TitleText: Text {
		Text("Shared Bill")
	}

	private var WindowContent: some View {
		VStack(alignment: .center) {
			MerchantAgreementPreview {
				if viewModel.step == .selectUsers {
					HapticEngine.shared.play(.buttonTap)
					self.modal = .selectVendor
					self.viewModel.showModalContent = true
				} else {
					self.showActionSheet = true
				}
			}
			.padding(.top, 172)

			if viewModel.step == .selectVendor {
				MerchantExpenseIntro(
					text: "Which bill would you like to split?",
					buttonText: "Find Your Biller"
				) {
					self.modal = .selectVendor
					self.viewModel.showModalContent = true
				}
				.onAppear {
					DispatchQueue.global(qos: .default).async {
						logger.info("User reached shared bill find your biller screen")
					}
				}
			} else if viewModel.step == .selectUsers {
				if let vendor = viewModel.vendor {
					Spacer()
					WizardNextButton(
						text: "Who are you splitting \(vendor.friendlyName) with?",
						buttonText: "Find Your Friends",
						isLoading: .constant(false),
						onContinue: {
							self.modal = .selectUsers
							self.viewModel.showModalContent = true
						}
					)
					.padding([.leading, .trailing], 14)
					.onAppear {
						DispatchQueue.global(qos: .default).async {
							logger.info("User reached shared bill find payers screen")
						}
					}
				}
			} else if viewModel.step == .selectSharingModel {
				Spacer()
				WizardNextButton(
					text: "How would you like to split it up?",
					buttonText: "Split It Up",
					isLoading: .constant(false),
					onContinue: {
						self.modal = .selectSharingModel
						self.viewModel.showModalContent = true
					}
				)
				.padding([.leading, .trailing], 14)
				.onAppear {
					DispatchQueue.global(qos: .default).async {
						logger.info("User reached shared bill split it up screen")
					}
				}
			} else if viewModel.step == .selectAccount {
				if let vendor = viewModel.vendor {
					Spacer()
					WizardNextButton(
						text: "Which account do you use to pay for \(vendor.friendlyName)?",
						buttonText: "Select Account",
						isLoading: .constant(false),
						onContinue: {
							self.modal = .selectAccount
							self.viewModel.showModalContent = true
						}
					)
					.padding([.leading, .trailing], 14)
					.onAppear {
						DispatchQueue.global(qos: .default).async {
							logger.info("User reached shared bill select account screen")
						}
					}
				}
			} else if viewModel.step == .review {
				Spacer()
				WizardNextButton(
					text: "When you get charged, we'll automatically split up the bill!",
					buttonText: "Great! Let's Do It.",
					isLoading: $isLoading,
					onContinue: {
						if let user = appState.user, !user.canReceiveFunds {
							showVerifiedCustomerSheet = true
							viewModel.showModalContent = true
						} else {
							createSharedExpense()
						}
					}
				)
				.padding([.leading, .trailing], 14)
				.onAppear {
					DispatchQueue.global(qos: .default).async {
						logger.info("User reached shared bill review screen")
					}
				}
			}
		}
		.padding([.leading, .trailing], 14)
		.frameFillParent()
	}

	private var VendorSheet: some View {
		VendorSearchView { maybeVendor in
			self.viewModel.showModalContent = false
			guard let vendor = maybeVendor else { return }
			self.viewModel.vendor = vendor
			if self.viewModel.step == .selectVendor {
				self.viewModel.step = .selectUsers
			}
		}
	}

	private var UserSheet: some View {
		UserSearchView { users in
			self.viewModel.showModalContent = false
			self.viewModel.addUsers(users)

			if users.count == 0 {
				self.viewModel.step = .selectUsers
				return
			}

			// If we've come back to this step from a later step don't go back to selecting a vendor
			if self.viewModel.step == .selectUsers {
				self.viewModel.step = users.count > 0 ? .selectSharingModel : .selectUsers
			}

			// If the users are edited after the review we need to make sure the sharing model is re-done
			if self.viewModel.step == .review {
				self.viewModel.step = .selectSharingModel
			}
		}
	}

	private var VerificationSheet: some View {
		VerifiedCustomerForm {
			guard let user = self.appState.user else { return }
			if !user.emailIsConfirmed {
				withAnimation {
					showVerifiedCustomerSheet = false
					viewModel.showEmailConfirmation = true
				}
				return
			}

			showVerifiedCustomerSheet = false
			self.viewModel.showModalContent = false

			if user.canReceiveFunds {
				// There's some timing issue in the SwiftUI framework that causes issues with the "Verify Email"
				// sheet unless we give the framework some buffer here.
				DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
					self.createSharedExpense()
				}
			}
		}
	}

	private func createSharedExpense() {
		isLoading = true
		viewModel.createSharedExpense { response in
			self.isLoading = false
			_ = response
				.effectLeft { err in
					self.isLoading = false
					switch err {
					case .emailConfirmationRequired:
						self.viewModel.showEmailConfirmation = true
						self.viewModel.showModalContent = true
					default:
						showSnackbar(message: err.localizedDescription)
					}
				}
				.effectRight { response in
					self.isLoading = false
					self.handleSubmissionSuccess(response)
				}
		}
	}

	private func handleSubmissionSuccess(_ response: SharedExpenseStory) {
		Sound.applePay.play()
		showSnackbar(message: "Success! Your agreement will become active when all participants accept.")
		presentationMode.wrappedValue.dismiss()
		// The websocket push will often get triggered before this success handler, so make sure that we're not
		// adding a duplicate story
		agreements.addOrReplace(story: response)
		agreements.setSelectedTab(.pending)
		navigation.setTab(.manageAgreements)
		onBoardingViewModel.set(hasSeenOnBoarding: true)
		appState.showPushNotificationPromptConditionally()
	}
}

struct MerchantSharedExpense_Previews: PreviewProvider {
	static var previews: some View {
		MerchantSharedExpense()
	}
}
