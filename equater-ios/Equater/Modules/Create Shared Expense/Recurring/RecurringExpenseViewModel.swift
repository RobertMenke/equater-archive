//
//  RecurringExpenseViewModel.swift
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
import UIKit

/// TODO: Should create a common parent class for RecurringExpenseViewModel
/// TODO: and MerchantExpenseViewModel
final class RecurringExpenseViewModel: Identifiable, ObservableObject, SharedExpenseViewModel {
	@Injected private var appState: AppState
	@Injected private var api: SharedExpenseApi
	@Published var step: RecurringSharedExpenseStep = .selectFrequency
	/// Expense sharing agreements can be initiated containing both active users
	/// and users we've invited to the platform. [activeUsers] is an array of
	/// user ids corresponding to users that are already on the platform.
	@Published var activeUsers: [User: Either<Error, Contribution>] = Dictionary()
	/// Expense sharing agreements can be initiated containing both active users
	/// and users we've invited to the platform. [prospectiveUsers] is an array of
	/// email addresses corresponding to users that should be invited to the platform.
	@Published var prospectiveUsers: [String: Either<Error, Contribution>] = Dictionary()
	/// Frequency in terms of days or months. Used in conjunction with interval.
	@Published var expenseFrequency: UInt = 1
	/// Controls the input for expense frequency
	@Published var expenseFrequencyInput = "1"
	/// Determines whether the expenseFrequency is in terms of days or months
	@Published var interval: RecurringExpenseInterval = .months
	/// When true, the sheet for days/months selection will be displayed
	@Published var showIntervalSelectionSheet = false

	@Published var isIndefinite = false

	@Published var startDateFormatted: String = Date().addDay(1).localDate().formatMonthDayYear()

	@Published var endDateFormatted: String = Date().addYear(1).localDate().formatMonthDayYear()

	@Published var startDate = Date().localDate().addDay(1) {
		didSet {
			startDateFormatted = startDate.formatMonthDayYear()
		}
	}

	@Published var endDate = Date().localDate().addYear(1) {
		didSet {
			endDateFormatted = endDate.formatMonthDayYear()
		}
	}

	@Published var depositoryAccount: UserAccount? = nil
	@Published var showModalContent = false
	@Published var isMakingEdit = false

	init() {
		SwiftEventBus.onMainThread(self, name: Event.emailIsConfirmed.rawValue) { _ in
			if self.showEmailConfirmation {
				self.showEmailConfirmation = false
				self.showModalContent = false
			}
		}
	}

	lazy var startDatePicker: UIDatePicker = {
		let datePicker = UIDatePicker()
		datePicker.datePickerMode = .date
		datePicker.calendar = Calendar.current
		datePicker.locale = Locale.current
		datePicker.date = self.startDate
		datePicker.timeZone = TimeZone(abbreviation: "GMT")
		if #available(iOS 14, *) {
			datePicker.preferredDatePickerStyle = .wheels
		}

		datePicker.addTarget(
			self,
			action: #selector(self.handleStartDatePicker),
			for: UIControl.Event.valueChanged
		)

		return datePicker
	}()

	lazy var endDatePicker: UIDatePicker = {
		let datePicker = UIDatePicker()
		datePicker.datePickerMode = .date
		datePicker.calendar = Calendar.current
		datePicker.locale = Locale.current
		datePicker.date = endDate
		datePicker.timeZone = TimeZone(abbreviation: "GMT")
		if #available(iOS 14, *) {
			datePicker.preferredDatePickerStyle = .wheels
		}

		datePicker.addTarget(
			self,
			action: #selector(self.handleEndDatePicker),
			for: UIControl.Event.valueChanged
		)

		return datePicker
	}()

	@Published var showEmailConfirmation = false

	var formError = ""

	private var disposables = Set<AnyCancellable>()

	func getDescription() -> String {
		if expenseFrequency == 1 {
			return "Every \(interval.getDescription(expenseFrequency).lowercasingFirstLetter()) starting \(startDate.formatMonthDayYear())"
		} else {
			return "Every \(expenseFrequency) \(interval.getDescription(expenseFrequency).lowercasingFirstLetter()) starting \(startDate.formatMonthDayYear())"
		}
	}

	func getFrequencyDescription() -> String {
		"\(startDateFormatted) - \(isIndefinite ? "Indefinite" : endDateFormatted)"
	}

	func getShortDescription() -> String {
		if expenseFrequency == 1 {
			return "Every \(interval.getDescription(expenseFrequency).lowercasingFirstLetter())"
		} else {
			return "Every \(expenseFrequency) \(interval.getDescription(expenseFrequency).lowercasingFirstLetter())"
		}
	}

	func frequencyIsValid() -> Bool {
		expenseFrequency > 0
	}

	func startDateIsValid() -> Bool {
		startDate > Date().localDate() && startDate < endDate
	}

	func endDateIsValid() -> Bool {
		isIndefinite || (endDate.localDate() > startDate && endDate > Date().localDate())
	}

	/// Look at each criteria of the recurrence model form and determine that the inputs are valid/invalid.
	/// if invalid, specify an error for the form
	func recurrenceModelIsValid() -> Bool {
		if !frequencyIsValid() {
			formError = "Please select a valid payment frequency"
			return false
		}

		if !startDateIsValid() {
			formError = "Start date must be in the future and less than the end date"
			return false
		}

		if !endDateIsValid() {
			formError = "End date must be greater than start date"
			return false
		}

		let activeUserContributionsAreValid = getUsers().first {
			self.getContribution($0)?.contributionValue ?? 0 <= 0
		}

		let prospectiveUserContributionsAreValid = getEmails().first {
			self.getContribution($0)?.contributionValue ?? 0 <= 0
		}

		if activeUserContributionsAreValid != nil || prospectiveUserContributionsAreValid != nil {
			formError = "All payer contribution amounts must be greater than 0"
			return false
		}

		formError = ""

		return true
	}

	func createSharedExpense(_ f: @escaping (Either<AppError, SharedExpenseStory>) -> Void) {
		guard let dto = try? createDto() else {
			f(.left(.networkError("Invalid expense detected. Call support for additional help.")))
			return
		}

		api
			.createRecurringSharedExpense(dto)
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
						f(.left(response.requiresEmailConfirmation() ? .emailConfirmationRequired : .defaultError))
					}
				}
			)
			.store(in: &disposables)
	}

	func createDto() throws -> CreateRecurringSharedExpenseDto {
		guard let depositoryAccount = depositoryAccount else {
			throw AppError.illegalState("A depository account is required to create a recurring expense")
		}

		return CreateRecurringSharedExpenseDto(
			activeUsers: try createUserMapForDto(),
			prospectiveUsers: try createProspectiveUserMapForDto(),
			expenseNickName: getShortDescription(),
			interval: interval,
			expenseFrequency: expenseFrequency,
			startDate: startDate.toISO(),
			endDate: isIndefinite ? nil : endDate.toISO(),
			expenseOwnerDestinationAccountId: depositoryAccount.id
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
	}

	/// Set the contribution for a prospective user
	func setContribution(forEmail email: String, contribution: Contribution) {
		prospectiveUsers[email] = .right(contribution)
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
	}

	func setError(forUser user: User, error: Error) {
		activeUsers[user] = .left(error)
	}

	/// Given an email and a contribution type, update the contribution
	func setContribution(forEmail email: String, contributionType: ExpenseContributionType, value: Int?) {
		prospectiveUsers[email] = .right(createContribution(contributionType: contributionType, value: value))
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
		activeUsers[user]?.fold(
			{ _ in nil },
			{ contribution in contribution }
		)
	}

	func getContribution(_ email: String) -> Contribution? {
		prospectiveUsers[email]?.fold(
			{ _ in nil },
			{ contribution in contribution }
		)
	}

	private func createUserMapForDto() throws -> [String: Contribution] {
		let keys = Array(activeUsers.keys)
		var dictionary: [String: Contribution] = Dictionary()
		for key in keys {
			guard let value = activeUsers[key] else {
				throw AppError.illegalState("Error submitting expense. Please contact support.")
			}

			if value.isLeft {
				throw AppError.illegalState("Please fix errors in the \"Select Amounts\" section")
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
				throw AppError.illegalState("Please fix errors in the \"Select Amounts\" section")
			}

			_ = value.effectRight {
				dictionary[key] = $0
			}
		}

		return dictionary
	}

	@objc func handleStartDatePicker(_ sender: UIDatePicker) {
		startDate = sender.date
	}

	@objc func handleEndDatePicker(_ sender: UIDatePicker) {
		endDate = sender.date
	}
}
