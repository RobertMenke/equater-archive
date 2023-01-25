//
//  TransactionItemView.swift
//  Equater
//
//  Created by Robert B. Menke on 7/4/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct TransactionItemView: View {
	@InjectedObject private var appState: AppState
	@InjectedObject private var viewModel: TransactionViewModel
	@InjectedObject private var homeScreenViewModel: HomeScreenViewModel
	var story: TransactionStory
	@State private var userAvatar: UIImage? = nil

	var body: some View {
		TransactionCard
	}

	var TransactionCard: some View {
		Card {
			self.makeAvatar()

			VStack(alignment: .leading) {
				AppText(self.createTertiaryText(), font: .subText)
					.padding(.leading, 8)

				AppText(self.createPrimaryText(), font: .primaryText)
					.padding(.leading, 8)
					.lineLimit(1)

				HStack(spacing: 0) {
					AppText(self.createSecondaryText(), font: .custom(size: 14, color: .textSecondary))
						.fontWeight(.semibold)
						.padding(.leading, 8)

					AppText(self.getSecondaryTextAmount(), font: .custom(size: 14.0, color: self.getAmountColor()))
						.fontWeight(.semibold)
				}
				.offset(y: 1)
			}
			.frameFillWidth(height: nil, alignment: .leading)

			Spacer()

			Image(systemName: "chevron.right")
				.font(.system(size: 16.0, weight: .bold))
				.foregroundColor(AppColor.textPrimary.color)
		}
		.onTapGesture {
			homeScreenViewModel.selectedTransactionStory = story
			DispatchQueue.main.async {
				homeScreenViewModel.navLinkSelection = "transaction-detail"
			}
		}
		.onAppear {
			if let linkedTransaction = viewModel.linkedTransaction, story.id == linkedTransaction.id {
				DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
					homeScreenViewModel.selectedTransactionStory = story
					self.viewModel.linkedTransaction = nil
					DispatchQueue.main.async {
						homeScreenViewModel.navLinkSelection = "transaction-detail"
					}
				}
			}
		}
	}

	private func createPrimaryText() -> String {
		story.sharedExpense.expenseNickName
	}

	private func createSecondaryText() -> String {
		guard let date = story.transaction.dateTimeInitiated.toISODate() else {
			return ""
		}

		return "\(date.formatWithSlashes()) · "
	}

	private func getSecondaryTextAmount() -> String {
		guard let user = appState.user else { return "" }

		let verb = story.transaction.sourceUserId == user.id ? "Paid" : "Received"
		return "\(verb) \(getAmount())"
	}

	private func getAmountColor() -> AppColor {
		guard let user = appState.user else { return .textPrimary }
		return story.transaction.sourceUserId == user.id ? .lightRedDecline : .lightGreenAccept
	}

	private func createTertiaryText() -> String {
		guard let user = appState.user else { return "" }
		let verb = story.payer.id == user.id ? "Paid to" : "Paid by"
		let otherUser = story.payer.id == user.id ? story.recipient : story.payer
		let otherUserName = "\(otherUser.firstName) \(otherUser.lastName)"
		return "\(verb) \(otherUserName)"
	}

	private func makeAvatar() -> some View {
		ZStack {
			Group {
				if let vendor = story.vendor {
					RemoteAvatar(
						photo: .vendorLogo(vendor: vendor),
						makeFallbackImage: { DefaultVendorImage(size: .custom(width: 44, height: 44)) },
						size: AvatarSize.custom(width: 44, height: 44)
					)
					.offset(x: 8)
				} else {
					AppImage
						.clockIconClipped
						.image
						.resizable()
						.aspectRatio(contentMode: .fit)
						.frame(width: 44, height: 44)
						.offset(x: 12, y: 4)
				}
			}

			ProfilePhotoAvatar(
				user: story.payer.id == appState.user?.id ? story.recipient : story.payer,
				image: $userAvatar,
				size: AvatarSize.custom(width: 44, height: 44)
			)
			.offset(x: -12, y: -4)
			.background(
				CircleBackground(borderColor: AppColor.textPrimary.color)
					.offset(x: -12, y: -4)
			)
		}
		.padding(.leading, 4)
	}

	private func getAmount() -> String {
		let decimal = Decimal(integerLiteral: story.transaction.totalTransactionAmount)

		return NSDecimalNumber.currencyDisplay(decimal: decimal / 100) ?? "$\(decimal / 100)"
	}
}

struct TransactionItemView_Previews: PreviewProvider {
	static var previews: some View {
		TransactionItemView(story: transactionStoryFake)
	}
}
