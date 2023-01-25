//
//  UserSearchViewModel.swift
//  Equater
//
//  Created by Robert B. Menke on 1/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Bow
import Combine
import Foundation
import Resolver

final class UserSearchViewModel: Identifiable, ObservableObject {
	@Injected private var searchApi: UserSearchApi
	@Injected private var filePersistenceService: FilePersistenceService

	@Published var searchTerm = ""
	@Published var selectedUsers: [User] = []
	@Published var usersToInvite: [String] = []
	@Published var selection: [Either<String, User>] = []
	@Published var friends: [User] = []
	@Published var users: [User] = []
	@Published var filteredFriends: [User] = []
	@Published var filteredUsers: [User] = []
	@Published var searchError = ""
	@Published var requestIsLoading = false
	@Published var hasCompletedSearch = false

	private var lastResponse: UserSearchResponse?
	private var disposables = Set<AnyCancellable>()

	static var allRelationships: [User] = []

	init() {
		createSearchListener()
		$searchTerm
			.dropFirst()
			.sink(receiveValue: { _ in
				self.hasCompletedSearch = false
			})
			.store(in: &disposables)
		friends = Self.allRelationships
		filterFriendsLists()
	}

	func fetchRelationships() {
		searchApi
			.fetchRelationships()
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { completion in
					switch completion {
					case .failure(let err):
						debugPrint(err)
					case .finished:
						break
					}
				},
				receiveValue: { (response: HttpResponse<[User]>) in
					guard let body = response.body else { return }
					Self.allRelationships = body
					self.friends = Self.allRelationships
					self.filterFriendsLists()
					logger.console("Fetched \(body.count) relationships")
					DispatchQueue.global(qos: .default).async {
						self.friends.forEach {
							if $0.profilePhotoSha256Hash != nil {
								self.filePersistenceService.preCache(photo: .avatar(user: $0))
							}

							if $0.coverPhotoSha256Hash != nil {
								self.filePersistenceService.preCache(photo: .coverPhoto(user: $0))
							}
						}
					}
				}
			)
			.store(in: &disposables)
	}

	func removeUserFromSelection(user: User) {
		selectedUsers = selectedUsers.filter { $0.id != user.id }
		filterFriendsLists()
		selection = selection.filter { !$0.match(user) }
	}

	func addUserToSelection(user: User) {
		selectedUsers.append(user)
		filterFriendsLists()
		selection.append(.right(user))
		if friends.first(where: { friend in friend.id == user.id }) == nil {
			friends.append(user)
			Self.allRelationships.append(user)
		}
	}

	func addEmailToSelection(email: String) {
		let found = usersToInvite.first { $0 == email }
		if found == nil {
			usersToInvite.append(email.trimmingCharacters(in: .whitespaces))
			selection.append(.left(email))
		}
	}

	func removeEmailFromSelection(email: String) {
		usersToInvite = usersToInvite.filter { $0 != email }
		selection = selection.filter { !$0.match(email) }
	}

	func filterFriendsLists() {
		filteredFriends = friends.filter { !isSelected($0) }
		filteredUsers = users.filter { !isSelected($0) }
	}

	func isSelected(_ user: User) -> Bool {
		selectedUsers.first { $0.id == user.id } != nil
	}

	private func createSearchListener() {
		$searchTerm
			.dropFirst()
			.removeDuplicates()
			.debounce(for: 0.5, scheduler: DispatchQueue.main)
			.map {
				print("Searching \($0)")
				self.requestIsLoading = true
				return UserSearchRequest(searchTerm: $0)
			}
			.setFailureType(to: AppError.self)
			.filter {
				if $0.searchTerm.isEmpty {
					self.requestIsLoading = false
					self.hasCompletedSearch = false
					self.users = []
					self.friends = Self.allRelationships
					self.filterFriendsLists()
				}

				return !$0.searchTerm.isEmpty
			}
			.flatMap { self.searchApi.search($0) }
			.catch { err in
				Just(HttpResponse<UserSearchResponse>(
					status: 200,
					error: err.localizedDescription,
					body: UserSearchResponse(
						friends: self.lastResponse?.friends ?? Self.allRelationships,
						users: self.lastResponse?.users ?? []
					)
				))
			}
			.receive(on: DispatchQueue.main)
			.sink(receiveValue: { (response: HttpResponse<UserSearchResponse>) in
				guard let body = response.body else { return }
				if let error = response.error {
					logger.error("\(error)")
					self.searchError = "Search error"
				}
				self.lastResponse = body
				self.friends = body.friends
				self.users = body.users
				self.requestIsLoading = false
				self.filterFriendsLists()
				self.hasCompletedSearch = self.searchTerm.count > 0
			})
			.store(in: &disposables)
	}
}

extension Either where A == String, B == User {
	func match(_ user: User) -> Bool {
		fold(
			{ email in email == user.email },
			{ selectedUser in selectedUser.id == user.id }
		)
	}

	func match(_ email: String) -> Bool {
		fold(
			{ emailAddress in emailAddress == email },
			{ _ in false }
		)
	}
}
