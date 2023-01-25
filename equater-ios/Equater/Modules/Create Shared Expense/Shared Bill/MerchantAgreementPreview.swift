//
//  AgreementPreview.swift
//  Equater
//
//  Created by Robert B. Menke on 12/27/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct MerchantAgreementPreview: View {
	@InjectedObject private var viewModel: MerchantExpenseViewModel
	@InjectedObject private var appState: AppState
	let onEditRequested: () -> Void

	var body: some View {
		Group {
			switch viewModel.step {
			case .selectVendor:
				EmptyView()
			case .selectUsers:
				if let user = appState.user, let vendor = viewModel.vendor {
					VStack(spacing: 1) {
						Header(user: user, vendor: vendor)
						Edit
					}
				} else {
					EmptyView()
				}

			case .selectSharingModel, .selectAccount, .review:
				if let user = appState.user, let vendor = viewModel.vendor {
					VStack(spacing: 1) {
						Header(user: user, vendor: vendor)
						HorizontalUserList()
						Edit
					}
				} else {
					EmptyView()
				}
			}
		}
	}

	func Header(user: User, vendor: Vendor) -> some View {
		HStack(alignment: .center) {
			RemoteAvatar(
				photo: .vendorLogo(vendor: vendor),
				makeFallbackImage: { DefaultVendorImage() }
			)

			VStack(alignment: .leading) {
				if let account = viewModel.expenseOwnerSourceAccount, viewModel.step == MerchantSharedExpenseStep.review {
					AppText("\(account.accountName)", font: .subText)
						.padding(.leading, 4)
				} else {
					AppText("\(user.firstName) \(user.lastName)", font: .subText)
						.padding(.leading, 4)
				}

				AppText("\(user.firstName.possessive()) \(vendor.friendlyName) bill", font: .primaryText)
					.padding(.leading, 4)
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

	func HorizontalUserList() -> some View {
		var users: [User] = []
		if let user = appState.user {
			users = [user] + viewModel.getUsers()
		} else {
			users = viewModel.getUsers()
		}
		let emails = viewModel.getEmails()

		return ScrollView(.horizontal) {
			HStack(alignment: .center, spacing: 10) {
				ForEach(users, id: \.self) { user in
					ExpenseParticipantUserDisplay(
						user: user,
						contribution: self.getContribution(user),
						totalParticipants: users.count + emails.count
					)
				}

				ForEach(emails, id: \.self) { email in
					ExpenseParticipantEmailDisplay(
						email: email,
						contribution: self.getContribution(email),
						totalParticipants: users.count + emails.count
					)
				}
			}
		}
		.frameFillWidth(height: 105, alignment: .center)
		.padding([.leading, .trailing], 20)
		.background(AppColor.backgroundSecondary.color)
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

	private func getContribution(_ user: User) -> Contribution? {
		if viewModel.step != .selectAccount, viewModel.step != .review {
			return nil
		}

		return viewModel.getContribution(user)
	}

	private func getContribution(_ email: String) -> Contribution? {
		if viewModel.step != .selectAccount, viewModel.step != .review {
			return nil
		}

		return viewModel.getContribution(email)
	}
}

struct AgreementPreview_Previews: PreviewProvider {
	static var previews: some View {
		MerchantAgreementPreview {}
	}
}
