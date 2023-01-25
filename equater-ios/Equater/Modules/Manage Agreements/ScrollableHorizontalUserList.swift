//
//  ScrollableHorizontalUserList.swift
//  Equater
//
//  Created by Robert B. Menke on 6/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct ScrollableHorizontalUserList: View {
	@InjectedObject private var appState: AppState
	@InjectedObject private var viewModel: AgreementsViewModel
	var story: SharedExpenseStory

	var body: some View {
		ScrollView(.horizontal) {
			HStack(alignment: .center, spacing: 10) {
				ForEach(getActiveUserList()) { user in
					ExpenseParticipantUserDisplay(
						user: user,
						contribution: self.viewModel.getContribution(for: self.story, and: user),
						totalParticipants: self.story.activeUsers.count + self.story.prospectiveUsers.count + 1
					)
				}

				ForEach(story.prospectiveUsers.map(\.email)) { email in
					ExpenseParticipantEmailDisplay(
						email: email,
						contribution: self.viewModel.getContribution(for: self.story, and: email),
						totalParticipants: self.story.activeUsers.count + self.story.prospectiveUsers.count + 1
					)
				}
			}
		}
		.padding([.leading, .trailing], 16)
		.frameFillWidth(height: 105, alignment: .center)
		.background(AppColor.backgroundSecondary.color)
	}

	func getActiveUserList() -> [User] {
		if story.sharedExpense.sharedExpenseType == .transactionWebHook {
			return [story.initiatingUser] + story.activeUsers
		}

		return story.activeUsers
	}
}

struct ScrollableHorizontalUserList_Previews: PreviewProvider {
	static var previews: some View {
		ScrollableHorizontalUserList(story: sharedExpenseStoryFake)
	}
}
