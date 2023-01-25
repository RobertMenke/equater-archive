//
//  AgreementUserCard.swift
//  Equater
//
//  Created by Robert B. Menke on 6/28/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Bow
import Resolver
import SwiftUI

struct AgreementUserCard: View {
	@InjectedObject private var viewModel: AgreementsViewModel
	var story: SharedExpenseStory
	var user: Either<UserInvite, User>
	var showAgreementStatus: Bool

	@SwiftUI.State private var profileImage: UIImage? = nil

	var body: some View {
		HStack(alignment: .center) {
			self.createAvatar()

			VStack(alignment: .leading, spacing: 4) {
				AppText(self.createPrimaryText(), font: .primaryText)
					.padding(.leading, 4)
					.lineLimit(1)

				AppText(self.createSecondaryText(), font: .subText)
					.padding(.leading, 4)
			}
			.frameFillWidth(height: nil, alignment: .leading)

			Spacer()

			if self.showAgreementStatus {
				self.makeAgreementStatusView()
			}
		}
		.frame(
			minWidth: 0,
			maxWidth: .infinity,
			minHeight: 70,
			maxHeight: nil,
			alignment: Alignment.leading
		)
		.padding([.leading, .trailing], 16)
	}

	private func makeAgreementStatusView() -> some View {
		user.fold(
			{ _ in AppText("Pending", font: .custom(size: 16.0, color: .textSecondary)) },
			{ user in
				if story.initiatingUser.id == user.id {
					return AppText("Owner", font: .custom(size: 16.0, color: .greenAccept))
				}

				switch self.viewModel.getAgreementStatus(forStory: story, andUser: user) {
				case .active:
					return AppText("Active", font: .custom(size: 16.0, color: .greenAccept))
				case .pending:
					return AppText("Pending", font: .custom(size: 16.0, color: .textSecondary))
				case .inactive:
					return AppText("Canceled", font: .custom(size: 16.0, color: .redDecline))
				case .none:
					return AppText("", font: .primaryText)
				}
			}
		)
	}

	private func createPrimaryText() -> String {
		user.fold(
			{ invite in invite.email },
			{ user in "\(user.firstName) \(user.lastName)" }
		)
	}

	private func createSecondaryText() -> String {
		user.fold(
			{ _ in "Invite sent to email" },
			{ user in
				if story.initiatingUser.id == user.id {
					return story.getContributionDisplayForOwner(user)
				} else {
					return createSecondaryTextForPayee(user)
				}
			}
		)
	}

	private func createSecondaryTextForPayee(_ user: User) -> String {
		let contribution = viewModel.getContribution(for: story, and: user)
		let totalContributors = story.activeUsers.count + story.prospectiveUsers.count + 1
		if let display = contribution?.display(totalContributors: totalContributors) {
			return "Pays \(display)"
		}

		return user.email
	}

	private func createAvatar() -> some View {
		user.fold(
			{ invite in UserInviteAvatar(email: invite.email).typeErased },
			{ user in ProfilePhotoAvatar(user: user, image: self.$profileImage).typeErased }
		)
	}
}

struct AgreementUserCard_Previews: PreviewProvider {
	static var previews: some View {
		AgreementUserCard(
			story: sharedExpenseStoryFake,
			user: .right(userFake),
			showAgreementStatus: true
		)
	}
}
