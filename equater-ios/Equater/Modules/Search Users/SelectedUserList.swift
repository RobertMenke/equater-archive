//
//  SelectedUserList.swift
//  Equater
//
//  Created by Robert B. Menke on 2/16/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct SelectedUserList: View {
	@InjectedObject var viewModel: UserSearchViewModel

	var body: some View {
		ScrollView(.horizontal) {
			HStack(spacing: 20) {
				ForEach(self.viewModel.selectedUsers, id: \.self) { user in
					SelectedUserCard(user: user) { userToRemove in
						self.viewModel.removeUserFromSelection(user: userToRemove)
					}
				}

				ForEach(self.viewModel.usersToInvite, id: \.self) { email in
					SelectedEmailCard(email: email) { emailToRemove in
						self.viewModel.removeEmailFromSelection(email: emailToRemove)
					}
				}
			}
			.frame(height: 85)
			.padding([.leading, .trailing], 20)
		}
	}
}

struct SelectedUserList_Previews: PreviewProvider {
	static var previews: some View {
		SelectedUserList()
	}
}
