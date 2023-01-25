//
//  MerchantExpenseAgreement.swift
//  Equater
//
//  Created by Robert B. Menke on 6/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

/// Header height: 90
/// body height: 125
/// Decline/Accept Height: 48
struct ExpenseAgreement: View {
	@InjectedObject private var viewModel: AgreementsViewModel
	var story: SharedExpenseStory
	var onTap: () -> Void

	var body: some View {
		let isPendingAgreement = viewModel.agreementIsPending(forStory: story)

		return VStack(spacing: 1) {
			ExpenseAgreementHeader(story: story, onTap: onTap)
			ScrollableHorizontalUserList(story: story)
				.cornerRadius(isPendingAgreement ? 0 : 8, corners: [.bottomLeft, .bottomRight])
			if isPendingAgreement {
				AcceptOrDecline(story: story)
			}
		}
		.frame(height: isPendingAgreement ? 245 : 196)
	}
}

private struct ExpenseAgreementHeader: View {
	@InjectedObject private var viewModel: AgreementsViewModel
	@InjectedObject private var homeScreenViewModel: HomeScreenViewModel
	var story: SharedExpenseStory
	var onTap: () -> Void

	var body: some View {
		Card
	}

	var Card: some View {
		HStack(alignment: .center) {
			self.makeAvatar()

			VStack(alignment: .leading) {
				AppText("\(self.story.initiatingUser.firstName) \(self.story.initiatingUser.lastName)", font: .subText)
					.padding(.leading, 4)

				AppText(self.story.sharedExpense.expenseNickName, font: .primaryText)
					.padding(.leading, 4)
			}
			.frameFillWidth(height: nil, alignment: .leading)

			Spacer()

			Image(systemName: "chevron.right")
				.font(.system(size: 16.0, weight: .bold))
				.foregroundColor(AppColor.textPrimary.color)
		}
		.padding([.trailing, .leading], 16)
		.frameFillWidth(height: 90, alignment: .center)
		.foregroundColor(.secondary)
		.background(AppColor.backgroundSecondary.color)
		.cornerRadius(8, corners: [.topLeft, .topRight])
		.onTapGesture {
			onTap()
		}
		.onAppear {
			if let linkedStory = viewModel.linkedSharedExpense, linkedStory.id == story.id {
				DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
					homeScreenViewModel.selectedAgreementStory = story
					viewModel.linkedSharedExpense = nil
					DispatchQueue.main.async {
						homeScreenViewModel.navLinkSelection = "expense-agreement"
					}
				}
			}
		}
	}

	private func makeAvatar() -> some View {
		if let vendor = story.vendor {
			return RemoteAvatar(
				photo: .vendorLogo(vendor: vendor),
				makeFallbackImage: { DefaultVendorImage() }
			).typeErased
		}

		return AppImage
			.clockIconClipped
			.image
			.resizable()
			.aspectRatio(contentMode: .fit)
			.frame(width: AvatarSize.defaultSize.width, height: AvatarSize.defaultSize.height)
			.typeErased
	}
}

private struct AcceptOrDecline: View {
	@InjectedObject private var viewModel: AgreementsViewModel
	@InjectedObject private var appState: AppState
	var story: SharedExpenseStory
	@State private var declineIsLoading = false
	@State private var acceptIsLoading = false

	var body: some View {
		HStack(alignment: .center, spacing: 1) {
			HStack(alignment: .center) {
				if declineIsLoading {
					ActivityIndicator(isAnimating: $declineIsLoading, style: .medium)
				} else {
					AppText("Decline", font: .custom(size: 18.0, color: .lightRedDecline))
				}
			}
			.frameFillHeight(width: .infinity, alignment: .center)
			.background(AppColor.backgroundSecondary.color)
			.onTapGesture {
				self.declineIsLoading = true
				self.viewModel.agreementAction = .decline
				self.viewModel.updateAgreement(forStory: self.story, doesAccept: false) { response in
					self.declineIsLoading = false
					guard let updatedStory = response?.body else {
						if response?.requiresEmailConfirmation() ?? false {
							self.viewModel.showSheet = true
							return
						}

						showSnackbar(message: "Unable to decline agreement. Please contact support.")
						return
					}

					showSnackbar(message: "Agreement has been declined")
					self.viewModel.update(story: updatedStory)
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

			HStack(alignment: .center) {
				if acceptIsLoading {
					ActivityIndicator(isAnimating: $acceptIsLoading, style: .medium)
				} else {
					AppText("Accept", font: .custom(size: 18.0, color: .lightGreenAccept))
				}
			}
			.frameFillHeight(width: .infinity, alignment: .center)
			.background(AppColor.backgroundSecondary.color)
			.onTapGesture {
				self.acceptAgreement()
			}
		}
		.frameFillWidth(height: 48, alignment: .center)
		.cornerRadius(8, corners: [.bottomLeft, .bottomRight])
	}

	private func acceptAgreement() {
		viewModel.agreementAction = .accept
		viewModel.sharedExpenseIdForAgreementAction = story.sharedExpense.id
		if let accountId = viewModel.getPaymentAccountId(sharedExpenseId: story.id) {
			commitAcceptedAgreement(accountId)
		} else {
			viewModel.showSheet(andThen: {
				commitAcceptedAgreement($0)
			})
		}
	}

	private func commitAcceptedAgreement(_ paymentAccountId: UInt) {
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
			viewModel.update(story: updatedStory)
			viewModel.moveToStoryTab(updatedStory)
			appState.showPushNotificationPromptConditionally()
			DispatchQueue.global(qos: .default).async {
				guard let user = appState.user else { return }
				if let agreement = viewModel.getAgreement(forStory: self.story) {
					logger.info("Agreement with id \(agreement.id) accepted by \(user.id)")
				}
			}
		}
	}
}

struct ExpenseAgreement_Previews: PreviewProvider {
	static var previews: some View {
		ExpenseAgreement(story: SharedExpenseStory(
			sharedExpense: sharedExpenseFake,
			initiatingUser: userFake,
			vendor: vendorFake,
			agreements: [sharedExpenseAgreementFake],
			activeUsers: [userFake],
			prospectiveUsers: [userInviteFake]
		), onTap: {})
	}
}
