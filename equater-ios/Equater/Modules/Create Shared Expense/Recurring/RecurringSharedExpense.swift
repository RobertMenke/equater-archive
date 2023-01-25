//
//  RecurringSharedExpense.swift
//  Equater
//
//  Created by Robert B. Menke on 5/25/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct RecurringSharedExpense: View {
	@Environment(\.presentationMode) private var presentationMode: Binding<PresentationMode>
	@InjectedObject private var appState: AppState
	@InjectedObject private var navigation: HomeScreenViewModel
	@InjectedObject private var agreements: AgreementsViewModel
	@InjectedObject private var viewModel: RecurringExpenseViewModel
	@InjectedObject private var onBoardingViewModel: OnBoardingViewModel
	@State private var modal: RecurringSharedExpenseStep = .selectUsers
	@State var showUserEditSheet = false
	@State private var showIdentityVerificationSheet = false
	@State private var isLoading = false
	@State private var navFinished = false

	var body: some View {
		Window {
			ZStack(alignment: .topLeading) {
				// This is a bit of an ugly hack so that the first responder chain doesn't cause
				// the nav view to freak out
				if self.navFinished {
					WindowContent
				}
				VStack {
					ProgressStepper(currentStep: viewModel.step, items: viewModel.step.getSteps()) { item in
						if let step = item as? RecurringSharedExpenseStep, item.getStepIndex() <= viewModel.step.getStepIndex() {
							viewModel.step = step
						}
					}
					.padding(.top, 120)
					.padding([.leading, .trailing], 14)
				}
				.frameFillParent()
			}
		}
		.offset(y: 0)
		.navigationBarTitle(Text("Scheduled Payments"))
		.sheet(
			isPresented: self.$viewModel.showModalContent,
			onDismiss: { self.viewModel.showEmailConfirmation = false }
		) {
			if viewModel.showEmailConfirmation {
				EmailVerificationPrompt
			} else if self.showIdentityVerificationSheet {
				VerificationForm
			} else if viewModel.isMakingEdit && modal == .selectFrequency {
				Frequency
			} else if viewModel.isMakingEdit && modal == .selectStartDate {
				StartDate
			} else if viewModel.isMakingEdit && modal == .selectEndDate {
				EndDate
			} else if viewModel.step == .selectUsers || viewModel.isMakingEdit && modal == .selectUsers {
				SelectUsers
			} else if viewModel.step == .selectAmounts || viewModel.isMakingEdit && modal == .selectAmounts {
				SelectAmounts
			} else if viewModel.step == .selectAccount || viewModel.isMakingEdit && modal == .selectAccount {
				SelectAccount
			} else {
				EmptyView().onAppear {
					// When no case is matched, dismiss the modal (should never happen and always represents a bug)
					logger.error("NO CASE MATCHED IN RECURRING SHARED EXPENSE SHEET. THIS IS A BUG.")
					viewModel.showModalContent = false
				}
			}
		}
		.withSheet(visible: self.$showUserEditSheet) {
			MenuItem(icon: .create, text: "Edit Frequency") {
				HapticEngine.shared.play(.buttonTap)
				viewModel.isMakingEdit = true
				self.modal = .selectFrequency
				self.viewModel.showModalContent = true
				self.showUserEditSheet = false
			}

			if viewModel.step.rawValue > RecurringSharedExpenseStep.selectStartDate.rawValue {
				MenuItem(icon: .clockIcon, text: "Edit Start Date") {
					HapticEngine.shared.play(.buttonTap)
					viewModel.isMakingEdit = true
					self.modal = .selectStartDate
					self.viewModel.showModalContent = true
					self.showUserEditSheet = false
				}
			}

			if viewModel.step.rawValue > RecurringSharedExpenseStep.selectEndDate.rawValue {
				MenuItem(icon: .cardSuccess, text: "Edit End Date") {
					HapticEngine.shared.play(.buttonTap)
					viewModel.isMakingEdit = true
					self.modal = .selectEndDate
					self.viewModel.showModalContent = true
					self.showUserEditSheet = false
				}
			}

			if viewModel.step.rawValue > RecurringSharedExpenseStep.selectUsers.rawValue {
				MenuItem(icon: .profile, text: "Edit Payers") {
					HapticEngine.shared.play(.buttonTap)
					viewModel.isMakingEdit = true
					self.modal = .selectUsers
					self.viewModel.showModalContent = true
					self.showUserEditSheet = false
				}
			}

			if viewModel.step.rawValue > RecurringSharedExpenseStep.selectAmounts.rawValue {
				MenuItem(icon: .walletIcon, text: "Edit Amounts") {
					HapticEngine.shared.play(.buttonTap)
					viewModel.isMakingEdit = true
					self.modal = .selectAmounts
					self.viewModel.showModalContent = true
					self.showUserEditSheet = false
				}
			}

			if viewModel.step.rawValue > RecurringSharedExpenseStep.selectAccount.rawValue {
				MenuItem(icon: .moneyTransfer, text: "Edit Account") {
					HapticEngine.shared.play(.buttonTap)
					viewModel.isMakingEdit = true
					self.modal = .selectAccount
					self.viewModel.showModalContent = true
					self.showUserEditSheet = false
				}
			}
		}
		.withSheet(visible: self.$viewModel.showIntervalSelectionSheet) {
			MenuItem(
				icon: .calendar,
				text: RecurringExpenseInterval.months.getDescription(self.viewModel.expenseFrequency),
				height: 70,
				onTap: {
					self.viewModel.interval = .months
					self.viewModel.showIntervalSelectionSheet = false
				}
			)

			MenuItem(
				icon: .clockIcon,
				text: RecurringExpenseInterval.days.getDescription(self.viewModel.expenseFrequency),
				height: 70,
				onTap: {
					self.viewModel.interval = .days
					self.viewModel.showIntervalSelectionSheet = false
				}
			)
		}
		.onAppear {
			self.navFinished = true
		}
	}

	private var WindowContent: some View {
		VStack(alignment: .center) {
			RecurringAgreementPreview {
				if viewModel.step == .selectStartDate {
					viewModel.isMakingEdit = true
					modal = .selectFrequency
					viewModel.showModalContent = true
				} else {
					resignAllResponders()
					showUserEditSheet = true
				}
			}
			.padding(.top, 172)
			.padding([.leading, .trailing], 14)

			if viewModel.step == .selectFrequency {
				Frequency
					.onAppear {
						DispatchQueue.global(qos: .default).async {
							logger.info("User reached recurring payment select frequency screen")
						}
					}
			} else if viewModel.step == .selectStartDate {
				StartDate
					.onAppear {
						DispatchQueue.global(qos: .default).async {
							logger.info("User reached recurring payment select start date screen")
						}
					}
			} else if viewModel.step == .selectEndDate {
				EndDate
					.onAppear {
						DispatchQueue.global(qos: .default).async {
							logger.info("User reached recurring payment select end date screen")
						}
					}
			} else if viewModel.step == .selectUsers || viewModel.step == .selectAmounts {
				Spacer()
				WizardNextButton(text: "Who are you charging?", buttonText: "Find Your Payers", isLoading: .constant(false)) {
					viewModel.showModalContent = true
				}
				.padding([.leading, .trailing], 14)
				.onAppear {
					DispatchQueue.global(qos: .default).async {
						logger.info("User reached recurring payment select users screen")
					}
				}
			} else if viewModel.step == .selectAccount {
				Spacer()
				WizardNextButton(
					text: "Which account should we deposit your money into?",
					buttonText: "Select Account",
					isLoading: .constant(false)
				) {
					viewModel.showModalContent = true
				}
				.padding([.leading, .trailing], 14)
				.onAppear {
					DispatchQueue.global(qos: .default).async {
						logger.info("User reached recurring payment select account screen")
					}
				}
			} else if viewModel.step == .review {
				Spacer()
				WizardNextButton(
					text: "Review your agreement",
					buttonText: "Create Agreement",
					isLoading: $isLoading
				) {
					if let user = appState.user, !user.canReceiveFunds {
						showIdentityVerificationSheet = true
						viewModel.showModalContent = true
					} else {
						createAgreement()
					}
				}
				.padding([.leading, .trailing], 14)
				.onAppear {
					DispatchQueue.global(qos: .default).async {
						logger.info("User reached recurring payment review screen")
					}
				}
			}
		}
	}

	private var Frequency: some View {
		RecurringFrequencyView {
			if viewModel.step == .selectFrequency {
				viewModel.step = .selectStartDate
			}

			viewModel.isMakingEdit = false
			viewModel.showModalContent = false
		}
	}

	private var StartDate: some View {
		RecurringStartDateView {
			if viewModel.step == .selectStartDate {
				viewModel.step = .selectEndDate
			}

			viewModel.isMakingEdit = false
			viewModel.showModalContent = false
		}
	}

	private var EndDate: some View {
		RecurringEndDateView {
			if viewModel.step == .selectEndDate {
				viewModel.step = .selectUsers
			}

			viewModel.isMakingEdit = false
			viewModel.showModalContent = false
		}
	}

	private var SelectUsers: some View {
		UserSearchView { users in
			self.viewModel.addUsers(users)

			if users.count == 0 {
				self.viewModel.step = .selectUsers
				self.viewModel.showModalContent = false
				return
			}

			withAnimation {
				if viewModel.isMakingEdit {
					modal = .selectAmounts
				} else {
					viewModel.step = .selectAmounts
				}
			}
		}
		.transition(.slideIn)
	}

	private var SelectAmounts: some View {
		RecurringExpenseAmountSelection {
			if self.viewModel.recurrenceModelIsValid() {
				if !viewModel.isMakingEdit {
					self.viewModel.step = .selectAccount
				}

				self.viewModel.showModalContent = false
				viewModel.isMakingEdit = false
			} else {
				showSnackbar(message: self.viewModel.formError)
			}
		}
		.transition(.slideIn)
	}

	private var SelectAccount: some View {
		LinkBankAccount(
			title: "Which account should we deposit your money into?",
			accountType: .depository
		) { account in
			self.viewModel.depositoryAccount = account
			self.viewModel.showModalContent = false
			self.viewModel.step = .review
			viewModel.isMakingEdit = false
		}
	}

	private var VerificationForm: some View {
		VerifiedCustomerForm {
			guard let user = self.appState.user else { return }

			if !user.emailIsConfirmed {
				withAnimation {
					showIdentityVerificationSheet = false
					viewModel.showEmailConfirmation = true
				}

				return
			}

			showIdentityVerificationSheet = false
			viewModel.showModalContent = false

			if user.canReceiveFunds {
				// There's some timing issue in the SwiftUI framework that causes issues with the "Verify Email"
				// sheet unless we give the framework some buffer here
				DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
					self.createAgreement()
				}
			}
		}
		.transition(.slideIn)
	}

	private var EmailVerificationPrompt: some View {
		EmailVerification {
			if showIdentityVerificationSheet {
				withAnimation {
					viewModel.showEmailConfirmation = false
				}
			} else {
				viewModel.showModalContent = false
				viewModel.showEmailConfirmation = false
			}
		}
		.transition(.slideIn)
	}

	private func makeQuestionPrompt(title: String, buttonText: String, action: @escaping () -> Void) -> some View {
		VStack {
			AppText(title, font: .title)
				.padding(.top, 24)
				.multilineTextAlignment(.center)
				.fixedSize(horizontal: false, vertical: true)

			ContainedButton(
				label: buttonText,
				enabled: true,
				size: .custom(width: .infinity, height: 50),
				isLoading: $isLoading,
				onTap: action
			)
		}
		.padding([.leading, .trailing], 14)
	}

	private func handleSuccessfulSubmission(_ response: SharedExpenseStory) {
		Sound.applePay.play()
		showSnackbar(message: "Success! Your agreement will become active when all participants accept.")
		presentationMode.wrappedValue.dismiss()
		// The websocket push will often get triggered before this success handler, so make sure that we're not
		// adding a duplicate story
		navigation.setTab(.manageAgreements)
		agreements.addOrReplace(story: response)
		agreements.setSelectedTab(.pending)
		onBoardingViewModel.set(hasSeenOnBoarding: true)
		appState.showPushNotificationPromptConditionally()
	}

	private func createAgreement() {
		if viewModel.recurrenceModelIsValid() {
			isLoading = true
			viewModel.createSharedExpense { response in
				isLoading = false
				_ = response
					.effectLeft {
						switch $0 {
						case .emailConfirmationRequired:
							self.viewModel.showEmailConfirmation = true
							self.viewModel.showModalContent = true
						default:
							showSnackbar(message: $0.localizedDescription)
						}
					}
					.effectRight { handleSuccessfulSubmission($0) }
			}

		} else {
			showSnackbar(message: viewModel.formError)
		}
	}
}

struct RecurringSharedExpense_Previews: PreviewProvider {
	static var previews: some View {
		RecurringSharedExpense()
	}
}
