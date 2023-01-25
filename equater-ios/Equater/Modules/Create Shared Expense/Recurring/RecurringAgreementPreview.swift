//
//  RecurringAgreementPreview.swift
//  Equater
//
//  Created by Robert B. Menke on 1/4/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct RecurringAgreementPreview: View {
	@InjectedObject private var viewModel: RecurringExpenseViewModel
	@InjectedObject private var appState: AppState
	let onEditRequested: () -> Void

	var body: some View {
		Group {
			switch viewModel.step {
			case .selectFrequency:
				EmptyView()
			case .selectStartDate, .selectEndDate, .selectUsers, .selectAmounts:
				if let user = appState.user {
					VStack(spacing: 1) {
						Header(user)
						Edit
					}
				} else {
					EmptyView()
				}
			case .selectAccount:
				if let user = appState.user {
					VStack(spacing: 1) {
						Header(user)
						self.HorizontalUserList()
						Edit
					}
				} else {
					EmptyView()
				}
			case .review:
				if let user = appState.user {
					VStack(spacing: 1) {
						Header(user)
						HorizontalUserList()
						if let account = viewModel.depositoryAccount {
							getBankAccountCard(account: account)
						}
						Edit
					}
				} else {
					EmptyView()
				}
			}
		}
	}

	func Header(_ user: User) -> some View {
		HStack(alignment: .center) {
			Avatar

			VStack(alignment: .leading) {
				if viewModel.step == .selectStartDate {
					AppText(viewModel.getShortDescription(), font: .primaryText)
						.padding(.leading, 4)
				} else if viewModel.step == .selectEndDate {
					AppText("Starting \(viewModel.startDateFormatted)", font: .subText)
						.padding(.leading, 4)

					AppText(viewModel.getShortDescription(), font: .primaryText)
						.padding(.leading, 4)
				} else {
					AppText(viewModel.getFrequencyDescription(), font: .subText)
						.padding(.leading, 4)

					AppText(viewModel.getShortDescription(), font: .primaryText)
						.padding(.leading, 4)
				}
			}
			.frameFillWidth(height: nil, alignment: .leading)

			Spacer()
		}
		.padding([.trailing, .leading], 16)
		.frameFillWidth(height: 90, alignment: .center)
		.foregroundColor(.secondary)
		.background(AppColor.backgroundSecondary.color)
		.cornerRadius(8, corners: [.topLeft, .topRight])
	}

	var Edit: some View {
		VStack(alignment: .center) {
			HStack(alignment: .center) {
				AppText("Edit", font: .primaryText)
			}
			.frameFillHeight(width: nil, alignment: .center)
		}
		.frameFillWidth(height: 48, alignment: .center)
		.background(AppColor.backgroundSecondary.color)
		.cornerRadius(8, corners: [.bottomLeft, .bottomRight])
		.onTapGesture {
			self.onEditRequested()
		}
	}

	func HorizontalUserList() -> some View {
		let users = viewModel.getUsers()
		let emails = viewModel.getEmails()

		return ScrollView(.horizontal) {
			HStack(alignment: .center, spacing: 10) {
				ForEach(users, id: \.self) { user in
					ExpenseParticipantUserDisplay(
						user: user,
						contribution: self.getContribution(user),
						totalParticipants: users.count + emails.count + 1
					)
				}

				ForEach(emails, id: \.self) { email in
					ExpenseParticipantEmailDisplay(
						email: email,
						contribution: self.getContribution(email),
						totalParticipants: users.count + emails.count + 1
					)
				}
			}
		}
		.frameFillWidth(height: 105, alignment: .center)
		.padding([.leading, .trailing], 20)
		.background(AppColor.backgroundSecondary.color)
	}

	private var Avatar: some View {
		AppImage
			.clockIconClipped
			.image
			.resizable()
			.aspectRatio(contentMode: .fit)
			.frame(width: AvatarSize.defaultSize.width, height: AvatarSize.defaultSize.height)
	}

	private func getBankAccountCard(account: UserAccount) -> some View {
		HStack(alignment: .center) {
			VStack(alignment: .center, spacing: 0) {
				RemoteImage(photo: .plaidInstitution(institution: account.institution)) {
					AppImage.wallet.image.resizable()
				}
				.aspectRatio(contentMode: .fit)
				.frame(width: 70, height: 60)

				AppText("Paid To", font: .subText)
					.padding(.leading, 4)
					.font(.system(size: 12))
			}

			VStack(alignment: .leading, spacing: 4) {
				AppText(account.institutionName, font: .primaryText)
					.padding(.leading, 4)
					.lineLimit(1)

				AppText(account.accountName, font: .subText)
					.padding(.leading, 4)
					.font(.system(size: 12))
			}
		}
		.frame(
			minWidth: 0,
			maxWidth: .infinity,
			minHeight: 70,
			maxHeight: nil,
			alignment: Alignment.leading
		)
		.padding(EdgeInsets(top: 10, leading: 16, bottom: 10, trailing: 16))
		.foregroundColor(.secondary)
		.background(AppColor.backgroundSecondary.color)
	}

	private func getContribution(_ user: User) -> Contribution? {
		if viewModel.step != .review, viewModel.step != .selectAccount, viewModel.step != .selectAmounts {
			return nil
		}

		return viewModel.getContribution(user)
	}

	private func getContribution(_ email: String) -> Contribution? {
		if viewModel.step != .review {
			return nil
		}

		return viewModel.getContribution(email)
	}
}

struct RecurringAgreementPreview_Previews: PreviewProvider {
	static var previews: some View {
		RecurringAgreementPreview {}
	}
}
