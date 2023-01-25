//
//  VerifiedCustomerViewModel.swift
//  Equater
//
//  Created by Robert B. Menke on 10/14/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Combine
import Resolver
import SwiftDate
import SwiftUI
import UIKit

final class VerifiedCustomerViewModel: Identifiable, ObservableObject {
	@Injected var restService: VerifiedCustomerApi
	@Injected var appState: AppState

	// MARK: - Properties

	@Published var address: Address? = nil {
		didSet {
			print("Address: \(address?.displayAddress() ?? "")")
			addressText = address?.displayAddress() ?? ""
		}
	}

	@Published var addressText = ""
	@Published var apartmentUnitText = "" {
		didSet {
			address?.addressTwo = apartmentUnitText
		}
	}

	private var minimumAge = Calendar.current.date(byAdding: .year, value: -18, to: Date().localDate()) ?? Date().localDate()

	@Published var dateOfBirth: Date = Calendar.current.date(byAdding: .year, value: -18, to: Date().localDate()) ?? Date().localDate() {
		didSet {
			if dateOfBirth < minimumAge {
				dateOfBirthIsValid = true
			}
			dateOfBirthDisplay = dateOfBirth.formatMonthDayYear()
		}
	}

	@Published var dateOfBirthDisplay = ""

	@Published var dateOfBirthIsValid = false
	@Published var lastFourOfSsn = "" {
		didSet {
			let copy = String(repeating: lastFourOfSsn, count: 1)
			var digits = copy.removeNonDigits()
			if digits.count > 4 {
				digits = digits.limitedTo(numCharacters: 4)
			}

			if digits != lastFourOfSsn {
				lastFourOfSsn = digits
			}
		}
	}

	@Published var ssnIsValid = false
	/// Once a SSN has been set you cannot update it
	/// See: https://docs.dwolla.com/#update-a-customer
	@Published var canUpdateSsn = true
	/// Once a DOB has been set you cannot update it
	/// See: https://docs.dwolla.com/#update-a-customer
	@Published var canUpdateDateOfBirth = true
	@Published var addressSearchIsDisplayed = false
	@Published var formSubmissionInProgress = false

	private var disposables = Set<AnyCancellable>()

	lazy var datePicker: UIDatePicker = {
		let datePicker = UIDatePicker()
		datePicker.datePickerMode = .date
		datePicker.date = self.dateOfBirth
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

	// MARK: - Constructor

	init() {
		$lastFourOfSsn
			.map { $0.removeNonDigits() }
			.sink(receiveValue: { value in
				self.ssnIsValid = value.count == 4
			})
			.store(in: &disposables)
	}

	// MARK: - Public Methods

	func formIsValid() -> Bool {
		if !canUpdateDateOfBirth, !canUpdateSsn {
			if address == nil {
				showSnackbar(message: "Please enter your address.")
				return false
			}

			return true
		}

		if !ssnIsValid {
			showSnackbar(message: "Please enter the last 4 digits of your social security number.")
			return false
		}
		if address == nil {
			showSnackbar(message: "Please enter your address.")
			return false
		}
		if !dateOfBirthIsValid {
			var message = "Please enter your date of birth."

			if dateOfBirthDisplay.trimmingCharacters(in: .whitespacesAndNewlines).count > 0 {
				message = "Must be born before \(minimumAge.formatMonthDayYear()) to use Equater."
			}

			showSnackbar(message: message)
			return false
		}

		return true
	}

	func submitForm(_ completion: @escaping () -> Void) {
		guard let user = appState.user else { return }
		if user.canReceiveFunds {
			updateAddress(completion)
		} else {
			updateCustomerVerification(completion)
		}
	}

	private func updateCustomerVerification(_ completion: @escaping () -> Void) {
		guard let address = address else {
			showSnackbar(message: "Please enter your address.")
			return
		}

		let request = RecipientOfFundsFormDto(
			address: address,
			dateOfBirth: stripTime(from: dateOfBirth),
			lastFourOfSsn: lastFourOfSsn
		)

		formSubmissionInProgress = true

		restService
			.updateProfile(request)
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { [weak self] value in
					guard let self = self else { return }
					switch value {
					case .failure(let err):
						logger.error("RecipientOfFunds Error: \(err)")
						showSnackbar(message: "The request failed. Please try again or contact us at \(EnvironmentService.get(.supportPhoneNumber)).")
						completion()
					case .finished:
						break
					}

					self.formSubmissionInProgress = false
				},
				receiveValue: { [weak self] response in
					guard let self = self else { return }

					if let dto = response.body {
						// Animate state updates so transitions are applied
						withAnimation {
							self.appState.set(user: dto)
							self.set(user: dto)
						}
					} else if let error = response.error {
						logger.error("RecipientOfFunds Error: \(error)")
						showSnackbar(message: "The request failed. Please try again or contact us at \(EnvironmentService.get(.supportPhoneNumber)).")
					}

					self.formSubmissionInProgress = false
					completion()
				}
			)
			.store(in: &disposables)
	}

	private func updateAddress(_ completion: @escaping () -> Void) {
		guard let address = address else {
			showSnackbar(message: "Please enter your address.")
			return
		}

		let request = PatchAddressDto(address: address)
		formSubmissionInProgress = true

		restService
			.updateAddress(request)
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { [weak self] value in
					guard let self = self else { return }
					switch value {
					case .failure(let err):
						logger.error("RecipientOfFunds Error: \(err)")
						showSnackbar(message: "The request failed. Please try again or contact us at \(EnvironmentService.get(.supportPhoneNumber)).")
						completion()
					case .finished:
						break
					}

					self.formSubmissionInProgress = false
				},
				receiveValue: { [weak self] response in
					guard let self = self else { return }

					if let dto = response.body {
						self.appState.set(user: dto)
						self.set(user: dto)
					} else if let error = response.error {
						logger.error("RecipientOfFunds Error: \(error)")
						showSnackbar(message: "The request failed. Please try again or contact us at \(EnvironmentService.get(.supportPhoneNumber)).")
					}

					self.formSubmissionInProgress = false
					completion()
				}
			)
			.store(in: &disposables)
	}

	func set(user: User) {
		if let address = user.getAddress() {
			self.address = address
			addressText = address.displayAddress()
			apartmentUnitText = user.addressTwo ?? ""
		}

		canUpdateSsn = !user.canReceiveFunds
		canUpdateDateOfBirth = !user.canReceiveFunds
	}

	@objc func handleStartDatePicker() {
		dateOfBirth = datePicker.date
	}

	private func stripTime(from originalDate: Date) -> Date {
		Calendar.current.startOfDay(for: originalDate)
	}
}
