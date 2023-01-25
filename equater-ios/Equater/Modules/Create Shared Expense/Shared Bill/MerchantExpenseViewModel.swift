//
//  MerchantExpenseViewModel.swift
//  Equater
//
//  Created by Robert B. Menke on 5/27/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Bow
import Combine
import Foundation
import Resolver
import SwiftEventBus

/// TODO: Should create a common parent class for RecurringExpenseViewModel
/// TODO: and MerchantExpenseViewModel
final class MerchantExpenseViewModel: Identifiable, ObservableObject, SharedExpenseViewModel {
	@Injected private var appState: AppState
	@Injected private var api: SharedExpenseApi
	@Published var step: MerchantSharedExpenseStep = .selectVendor
	/// Expense sharing agreements can be initiated containing both active users
	/// and users we've invited to the platform. [activeUsers] is an array of
	/// user ids corresponding to users that are already on the platform.
	@Published var activeUsers: [User: Either<Error, Contribution>] = Dictionary()
	/// Expense sharing agreements can be initiated containing both active users
	/// and users we've invited to the platform. [prospectiveUsers] is an array of
	/// email addresses corresponding to users that should be invited to the platform.
	@Published var prospectiveUsers: [String: Either<Error, Contribution>] = Dictionary()
	@Published var vendor: Vendor? = nil
	@Published var showEmailConfirmation = false
	@Published var showModalContent = false
	/// Only for percentage splits - we will show the remaining percentage to be paid by the expense
	/// owner or 0 if the percentage is negative
	@Published var expenseOwnerPercentageContribution = ""
	@Published var expenseOwnerSourceAccount: UserAccount? = nil
	@Published var expenseOwnerDestinationAccount: UserAccount? = nil

	private var disposables = Set<AnyCancellable>()

	init() {
		SwiftEventBus.onMainThread(self, name: Event.emailIsConfirmed.rawValue) { _ in
			if self.showEmailConfirmation {
				self.showEmailConfirmation = false
				self.showModalContent = false
			}
		}
	}

	func createSharedExpense(_ f: @escaping (Either<AppError, SharedExpenseStory>) -> Void) {
		guard let dto = try? createDto() else {
			f(.left(.networkError("Invalid expense detected. Call support for additional help.")))
			return
		}

		api
			.createMerchantSharedExpense(dto)
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { [weak self] value in
					guard self != nil else { return }
					switch value {
					case .failure(let err):
						logger.console("createMerchantSharedExpense \(err.localizedDescription)")
						f(.left(.defaultError))
					case .finished:
						logger.console("createMerchantSharedExpense finished")
					}
				},
				receiveValue: { response in
					if let body = response.body {
						logger.console("\(body)")
						f(.right(body))
					} else if let error = response.error {
						logger.console("Error: \(error)")
						var error: AppError = .defaultError

						if response.requiresEmailConfirmation() {
							error = .emailConfirmationRequired
						}

						if response.status == 422 {
							error = .hasExistingAgreement
						}

						f(.left(error))
					}
				}
			)
			.store(in: &disposables)
	}

	func createDto() throws -> CreateVendorWebHookSharedExpenseDto {
		guard let vendor = vendor else { throw AppError.illegalState("Please choose a vendor before creating a shared expense") }
		guard let user = appState.user else { throw AppError.illegalState("Please sign out and sign back in") }
		guard let account = expenseOwnerSourceAccount else { throw AppError.illegalState("Please select an the account used to pay for this expense") }

		return CreateVendorWebHookSharedExpenseDto(
			activeUsers: try createUserMapForDto(),
			prospectiveUsers: try createProspectiveUserMapForDto(),
			expenseNickName: "\(user.firstName.possessive()) \(vendor.friendlyName) bill",
			uniqueVendorId: vendor.id,
			expenseOwnerSourceAccountId: account.id,
			expenseOwnerDestinationAccountId: expenseOwnerDestinationAccount?.id ?? account.id
		)
	}

	/// Add an active user to the list
	func addActiveUser(user: User) {
		activeUsers[user] = .right(Contribution.getDefault())
	}

	/// Add a prospective user to the list
	func addProspectiveUser(email: String) {
		prospectiveUsers[email] = .right(Contribution.getDefault())
	}

	/// Set the contribution for an active user
	func setContribution(forUser user: User, contribution: Contribution) {
		activeUsers[user] = .right(contribution)

		if contribution.contributionType == .percentage {
			expenseOwnerPercentageContribution = String(calculateRemainingPercentageForExpenseOwner())
		}
	}

	/// Set the contribution for a prospective user
	func setContribution(forEmail email: String, contribution: Contribution) {
		prospectiveUsers[email] = .right(contribution)

		if contribution.contributionType == .percentage {
			expenseOwnerPercentageContribution = String(calculateRemainingPercentageForExpenseOwner())
		}
	}

	/// Add the raw output from UserSearchView to the view model
	func addUsers(_ users: [Either<String, User>]) {
		activeUsers = Dictionary()
		prospectiveUsers = Dictionary()

		users.forEach {
			$0.fold(
				addProspectiveUser(email:),
				addActiveUser(user:)
			)
		}
	}

	/// Given a user and a contribution type, update the contribution
	func setContribution(forUser user: User, contributionType: ExpenseContributionType, value: Int?) {
		activeUsers[user] = .right(createContribution(contributionType: contributionType, value: value))

		if contributionType == .percentage {
			expenseOwnerPercentageContribution = String(calculateRemainingPercentageForExpenseOwner())
		}
	}

	func setError(forUser user: User, error: Error) {
		activeUsers[user] = .left(error)
	}

	/// Given an email and a contribution type, update the contribution
	func setContribution(forEmail email: String, contributionType: ExpenseContributionType, value: Int?) {
		prospectiveUsers[email] = .right(createContribution(contributionType: contributionType, value: value))

		if contributionType == .percentage {
			expenseOwnerPercentageContribution = String(calculateRemainingPercentageForExpenseOwner())
		}
	}

	func setError(forEmail email: String, error: Error) {
		prospectiveUsers[email] = .left(error)
	}

	private func createContribution(contributionType: ExpenseContributionType, value: Int?) -> Contribution {
		switch contributionType {
		case .splitEvenly:
			return Contribution(contributionType: .splitEvenly, contributionValue: nil)
		case .percentage:
			return Contribution(contributionType: .percentage, contributionValue: value)
		case .fixed:
			return Contribution(contributionType: .fixed, contributionValue: value)
		}
	}

	func findError() -> String? {
		if let error = activeUsers.first(where: { _, value in value.isLeft }) {
			return error.value.fold(
				{ error in error.localizedDescription },
				{ _ in nil }
			)
		}

		if let error = prospectiveUsers.first(where: { _, value in value.isLeft }) {
			return error.value.fold(
				{ error in error.localizedDescription },
				{ _ in nil }
			)
		}

		return nil
	}

	/// +1 at the end for the user creating the agreement
	func countTotalParticipants() -> Int {
		activeUsers.count + prospectiveUsers.count + 1
	}

	func getUsers() -> [User] {
		Array(activeUsers.keys)
	}

	func getEmails() -> [String] {
		Array(prospectiveUsers.keys)
	}

	func getContribution(_ user: User) -> Contribution? {
		if user.id == appState.user?.id {
			return getExpenseOwnerContribution()
		}

		return activeUsers[user]?.fold(
			{ _ in nil },
			{ contribution in contribution }
		)
	}

	private func getExpenseOwnerContribution() -> Contribution? {
		let contributions: [Either<Error, Contribution>] = Array(activeUsers.values) + Array(prospectiveUsers.values)
		guard let validContribution = contributions.first(where: { either -> Bool in
			either.isRight
		}) else {
			return nil
		}

		let contribution = validContribution.rightValue

		switch contribution.contributionType {
		case .fixed:
			return Contribution(contributionType: .fixed, contributionValue: nil)
		case .percentage:
			return Contribution(contributionType: .percentage, contributionValue: calculateRemainingPercentageForExpenseOwner())
		case .splitEvenly:
			return Contribution(contributionType: .splitEvenly, contributionValue: nil)
		}
	}

	func getContribution(_ email: String) -> Contribution? {
		prospectiveUsers[email]?.fold(
			{ _ in nil },
			{ contribution in contribution }
		)
	}

	private func calculateRemainingPercentageForExpenseOwner() -> Int {
		let contributions: [Either<Error, Contribution>] = Array(activeUsers.values) + Array(prospectiveUsers.values)
		let sum = contributions.reduce(0) { (acc, either: Either<Error, Contribution>) -> Int in
			acc + either.fold(
				{ _ in 0 },
				{ contribution in contribution.contributionValue ?? 0 }
			)
		}

		return max(100 - sum, 0)
	}

	private func createUserMapForDto() throws -> [String: Contribution] {
		let keys = Array(activeUsers.keys)
		var dictionary: [String: Contribution] = Dictionary()
		for key in keys {
			guard let value = activeUsers[key] else {
				throw AppError.illegalState("Error submitting expense. Please contact support.")
			}

			if value.isLeft {
				throw AppError.illegalState("Please fix errors in the Split It Up section")
			}

			_ = value.effectRight {
				dictionary[String(key.id)] = $0
			}
		}

		return dictionary
	}

	private func createProspectiveUserMapForDto() throws -> [String: Contribution] {
		let keys = Array(prospectiveUsers.keys)
		var dictionary: [String: Contribution] = Dictionary()
		for key in keys {
			guard let value = prospectiveUsers[key] else {
				throw AppError.illegalState("Error submitting expense. Please contact support.")
			}

			if value.isLeft {
				throw AppError.illegalState("Please fix errors in the Split It Up section")
			}

			_ = value.effectRight {
				dictionary[key] = $0
			}
		}

		return dictionary
	}
}
