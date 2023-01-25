//
//  UserSearchView.swift
//  Equater
//
//  Created by Robert B. Menke on 1/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Bow
import Resolver
import SwiftUI

struct UserSearchView: View {
	@InjectedObject var viewModel: UserSearchViewModel
	/// When selected, the caller will get a list of users and emails of prospective users
	var onSelectionCompleted: ([Either<String, User>]) -> Void

	var body: some View {
		Window {
			HeaderWithContentLayout(
				headerHeight: 100,
				header: SearchBarHeader(
					title: "Add Payers",
					searchInputPlaceholder: "Search by name or email",
					searchText: self.$viewModel.searchTerm,
					isLoading: self.$viewModel.requestIsLoading,
					selection: self.viewModel.selection,
					onSelectionCompleted: self.onSelectionCompleted
				),
				content: UserList(
					friends: self.$viewModel.filteredFriends,
					users: self.$viewModel.filteredUsers
				)
			)
			.padding(.top, 20)
		}
	}
}

struct UserSearchView_Previews: PreviewProvider {
	static var previews: some View {
		UserSearchView { selectedUsers in
			print("Selected \(selectedUsers)")
		}
	}
}
