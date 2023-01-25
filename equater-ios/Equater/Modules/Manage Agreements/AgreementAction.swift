//
//  AgreementAction.swift
//  Equater
//
//  Created by Robert B. Menke on 6/28/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct AgreementAction: View {
	@InjectedObject private var viewModel: AgreementsViewModel
	@InjectedObject private var appState: AppState
	@Binding var story: SharedExpenseStory
	@Binding var declineIsLoading: Bool
	@State private var acceptIsLoading = false

	var body: some View {
		VStack {
			Spacer()
			createBody(status: viewModel.getAgreementStatus(forStory: story))
		}
		.frameFillParent()
		.padding([.leading, .trailing], 16)
		.padding(.bottom, 36)
	}

	private func createBody(status: AgreementStatus?) -> some View {
		VStack {
			/// The agreement has been canceled
			if story.sharedExpense.dateTimeDeactivated != nil {
				self.createLabel("This agreement was canceled")
			}
			/// Agreement is active, provide a means of canceling
			else if story.sharedExpense.isActive {
				SwipeToCancel
			}
			/// User has accepted, but is waiting for others to accept
			else if status == .active, story.sharedExpense.isPending {
				createLabel("Waiting for all participants to accept")
			}
			/// User has been invited, but hasn't accepted the agreement
			else if status == .pending {
				AcceptOrDecline
			} else if status == nil, story.sharedExpense.isPending {
				createLabel("Waiting for all participants to accept")
			}
		}
	}

	private func createLabel(_ text: String) -> some View {
		HStack(alignment: .center) {
			if declineIsLoading {
				ActivityIndicator(isAnimating: .constant(true), style: .medium)
			} else {
				Text(text)
					.font(.custom("Inter", size: 16.0))
					.foregroundColor(AppColor.textPrimary.color)
					.bold()
					.underline()
			}
		}
		.frameFillWidth(height: 50, alignment: .center)
		.cornerRadius(8)
	}

	var SwipeToCancel: some View {
		SlideToConfirm(
			slideInstructionText: "Swipe to cancel agreement",
			slideCompletedText: "Canceled",
			isLoading: $declineIsLoading,
			completion: { _ in
				self.viewModel.agreementAction = .decline
				self.declineIsLoading = true
				self.viewModel.updateAgreement(forStory: self.story, doesAccept: false) { response in
					self.declineIsLoading = false
					guard let updatedStory = response?.body else {
						if response?.requiresEmailConfirmation() ?? false {
							self.viewModel.showSheet = true
							return
						}

						showSnackbar(message: "Unable to cancel agreement. Please contact support.")
						return
					}

					Sound.applePay.play()
					showSnackbar(message: "Agreement has been canceled")
					self.story = updatedStory
					DispatchQueue.global(qos: .default).async {
						guard let user = appState.user else { return }
						if story.initiatingUser.id == user.id {
							logger.info("Shared expense agreement with id \(story.id) canceled by \(user.id)")
						}
						if let agreement = viewModel.getAgreement(forStory: self.story) {
							logger.info("Agreement with id \(agreement.id) canceled by \(user.id)")
						}
					}
				}
			}
		)
	}

	var AcceptOrDecline: some View {
		HStack(alignment: .center, spacing: 28) {
			ContainedButton(
				label: "Decline",
				enabled: true,
				size: .custom(width: .infinity, height: 50),
				isLoading: self.$declineIsLoading,
				backgroundColor: .redDecline,
				textColor: .white,
				onTap: {
					self.declineIsLoading = true
					self.viewModel.agreementAction = .decline
					self.viewModel.updateAgreement(forStory: self.story, doesAccept: false) { response in
						self.declineIsLoading = false
						guard let updatedStory = response?.body else {
							if response?.requiresEmailConfirmation() ?? false {
								self.viewModel.showSheet = true
								return
							}

							showSnackbar(message: "Unable to cancel agreement. Please contact support.")
							return
						}

						showSnackbar(message: "Agreement has been declined")
						self.story = updatedStory
						DispatchQueue.global(qos: .default).async {
							guard let user = appState.user else { return }
							if story.initiatingUser.id == user.id {
								logger.info("Shared expense agreement with id \(story.id) canceled by \(user.id)")
							}
							if let agreement = viewModel.getAgreement(forStory: self.story) {
								logger.info("Agreement with id \(agreement.id) canceled by \(user.id)")
							}
						}
					}
				}
			)

			ContainedButton(
				label: "Accept",
				enabled: true,
				size: .custom(width: .infinity, height: 50),
				isLoading: self.$acceptIsLoading,
				backgroundColor: .greenAccept,
				textColor: .white,
				onTap: {
					self.acceptAgreement()
				}
			)
		}
		.frameFillWidth(height: 50, alignment: .center)
		.padding([.leading, .trailing], 16)
	}

	private func acceptAgreement() {
		viewModel.agreementAction = .accept
		viewModel.sharedExpenseIdForAgreementAction = story.sharedExpense.id

		if let accountId = viewModel.getPaymentAccountId(sharedExpenseId: story.id) {
			commitAcceptAgreement(accountId)
		} else {
			viewModel.showSheet(andThen: {
				commitAcceptAgreement($0)
			})
		}
	}

	private func commitAcceptAgreement(_ paymentAccountId: UInt) {
		acceptIsLoading = true
		viewModel.updateAgreement(forStory: story, doesAccept: true, paymentAccountId: paymentAccountId) { response in
			self.acceptIsLoading = false
			guard let updatedStory = response?.body else {
				if response?.requiresEmailConfirmation() ?? false {
					self.viewModel.showSheet = true
					return
				}

				showSnackbar(message: "Unable to accept agreement. Please contact support.")
				return
			}
			Sound.applePay.play()
			showSnackbar(message: "Agreement accepted!")
			self.story = updatedStory
			self.appState.showPushNotificationPromptConditionally()
			DispatchQueue.global(qos: .default).async {
				guard let user = appState.user else { return }
				if let agreement = viewModel.getAgreement(forStory: self.story) {
					logger.info("Agreement with id \(agreement.id) accepted by \(user.id)")
				}
			}
		}
	}
}

struct AgreementAction_Previews: PreviewProvider {
	static var previews: some View {
		AgreementAction(story: .constant(sharedExpenseStoryFake), declineIsLoading: .constant(false))
	}
}
