//
//  UserList.swift
//  Equater
//
//  Created by Robert B. Menke on 1/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct UserList: View {
	@InjectedObject var viewModel: UserSearchViewModel
	@Binding var friends: [User]
	@Binding var users: [User]

	var body: some View {
		VerticalList(
			shouldShowNoResults: {
				self.friends.count == 0 && self.users.count == 0
			},
			onNoResults: {
				HStack(alignment: .top) {
					NoUserSearchResults(
						searchText: self.$viewModel.searchTerm,
						hasCompletedSearch: self.$viewModel.hasCompletedSearch,
						defaultText: "Search by name or email",
						onEmailSelection: { email in
							self.viewModel.addEmailToSelection(email: email)
							self.viewModel.searchTerm = ""
						}
					)
				}
			},
			listHeader: {
				Group {
					if self.viewModel.selection.count > 0 {
						SelectedUserSection()
					}
				}
			},
			content: {
				ForEach(self.friends + self.users, id: \.self) { user in
					UserCard(user: user, onSelected: { selectedUser in
						self.viewModel.addUserToSelection(user: selectedUser)
						self.viewModel.searchTerm = ""
					})
				}
			}
		)
	}
}

struct UserList_Previews: PreviewProvider {
	static var previews: some View {
		UserList(
			friends: .constant([userFake, userFake]),
			users: .constant([userFake, userFake])
		)
	}
}
