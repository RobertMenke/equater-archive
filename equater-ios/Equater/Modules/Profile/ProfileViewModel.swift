//
//  ProfileViewModel.swift
//  Equater
//
//  Created by Robert B. Menke on 5/17/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation
import Resolver
import SwiftEventBus
import SwiftUI

class ProfileViewModel: NSObject, Identifiable, ObservableObject {
	@Injected var restService: ProfileApi
	@Injected var appState: AppState

	@Published var avatar: UIImage?
	@Published var coverImage: UIImage?
	@Published var showAvatarSheet = false
	@Published var showCoverPhotoSheet = false
	@Published var firstName = ""
	@Published var lastName = ""
	@Published var isLoading = false
	@Published var balances: [Balance] = []

	private var disposables = Set<AnyCancellable>()

	override init() {
		super.init()
		SwiftEventBus.onMainThread(self, name: Event.userIsSignedOut.rawValue) { _ in
			// For some reason this isn't being reset when the resolver cache is cleared :/
			self.coverImage = nil
			self.avatar = nil
		}
	}

	func getPhotoType(user: User) -> Photo {
		if showCoverPhotoSheet {
			return .coverPhoto(user: user)
		}

		return .avatar(user: user)
	}

	func patchName(_ whenFinished: @escaping () -> Void) {
		guard firstName.count > 0, lastName.count > 0 else { return }
		let dto = ProfileDto(firstName: firstName, lastName: lastName)
		isLoading = true
		let errorMessage = "Unable to save profile"

		restService
			.patchName(dto)
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { [weak self] value in
					guard self != nil else { return }
					switch value {
					case .failure(let err):
						logger.error("Profile patch: \(err)")
						showSnackbar(message: errorMessage)
						self?.isLoading = false
					case .finished:
						self?.isLoading = false
						whenFinished()
					}
				},
				receiveValue: { [weak self] response in
					guard let self = self else { return }
					if let dto = response.body {
						// Animate the state update so that transitions are applied
						withAnimation {
							self.appState.set(user: dto)
						}
					} else if let error = response.error {
						logger.error("Profile patch: \(error)")
						showSnackbar(message: errorMessage)
					}
				}
			)
			.store(in: &disposables)
	}

	func getUserBalance() {
		restService
			.getBalance()
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { [weak self] value in
					guard self != nil else { return }
					switch value {
					case .failure(let err):
						logger.error("Get balance error: \(err)")
					case .finished:
						break
					}
				},
				receiveValue: { [weak self] response in
					guard let self = self else { return }
					if let body = response.body {
						self.balances = body
					} else if let error = response.error {
						logger.error("Get balance error: \(response.status) \(error)")
					}
				}
			)
			.store(in: &disposables)
	}

	/// Equater can keep multiple cards on file, which means multiple potential balances.
	/// Derive a total balance by summing all other balances
	/// It's the responsibility of the server to handle reconciliation of each individual
	/// balance if it exists
	func getTotalBalanceFormatted() -> String {
		guard balances.count > 0 else { return "$0.00" }

		let total = balances.sum { $0.dineroValueRepresentation }
		let decimalTotal = Decimal(total)
		let totalWithPrecision = decimalTotal / 100
		guard let currency = NSDecimalNumber.currency(decimal: totalWithPrecision) else { return "$0.00" }

		return "$\(currency)"
	}
}
