//
//  EditableHoriztonalUserList.swift
//  Equater
//
//  Created by Robert B. Menke on 5/31/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct EditableHoriztonalUserList: View {
	var viewModel: SharedExpenseViewModel
	var showContribution: Bool
	var onEditRequested: () -> Void

	var body: some View {
		let users = viewModel.getUsers()
		let emails = viewModel.getEmails()

		return VStack(spacing: 1) {
			ScrollView(.horizontal) {
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
			.cornerRadius(8, corners: [.topLeft, .topRight])

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
		.frameFillWidth(height: nil)
		.clipped()
		.shadowSmall()
	}

	private func getContribution(_ user: User) -> Contribution? {
		guard showContribution else { return nil }

		return viewModel.getContribution(user)
	}

	private func getContribution(_ email: String) -> Contribution? {
		guard showContribution else { return nil }

		return viewModel.getContribution(email)
	}
}

struct EditableHoriztonalUserList_Previews: PreviewProvider {
	static var previews: some View {
		EditableHoriztonalUserList(viewModel: MerchantExpenseViewModel(), showContribution: false) {
			print("Edit requested")
		}
	}
}
