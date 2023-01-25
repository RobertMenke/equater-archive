//
//  SharedExpenseViewModel.swift
//  Equater
//
//  Created by Robert B. Menke on 5/24/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation
import Resolver

protocol SharedExpenseViewModel {
	/// Get the active users that are part of this shared expense
	func getUsers() -> [User]

	/// Get the prospective users (email addresses) that are part of this
	/// shared expense
	func getEmails() -> [String]

	/// Given a user, try to find a matching contribution
	func getContribution(_ user: User) -> Contribution?

	/// Given an email, try to find a matching contribution
	func getContribution(_ email: String) -> Contribution?
}
