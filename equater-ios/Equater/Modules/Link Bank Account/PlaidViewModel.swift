//
//  PlaidViewModel.swift
//  Equater
//
//  Created by Robert B. Menke on 9/8/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation
import Resolver

final class PlaidViewModel: Identifiable, ObservableObject {
	@Injected var service: PlaidRestApi
	@InjectedObject var appState: AppState

	@Published var plaidPatchRequestInProgress = false

	// MARK: - Private member variables

	private var disposables = Set<AnyCancellable>()

	init() {}

	func persistPlaidLinkResponse(plaidLinkResponse: PlaidLinkJson, _ f: @escaping (UserAccount) -> Void) {
		plaidPatchRequestInProgress = true

		DispatchQueue.global(qos: .default).async {
			self
				.service
				.storePlaidToken(dto: plaidLinkResponse)
				.receive(on: DispatchQueue.main)
				.sink(
					receiveCompletion: { [weak self] value in
						guard self != nil else { return }
						switch value {
						case .failure(let err):
							self?.plaidPatchRequestInProgress = false
							logger.error("Plaid token patch request failed with \(err.localizedDescription)")
							showSnackbar(message: "We were unable to configure your account. Please call support at \(EnvironmentService.get(.supportPhoneNumber))")
							self?.plaidPatchRequestInProgress = false
						case .finished:
							self?.plaidPatchRequestInProgress = false
							logger.info("Plaid token patch request succeeded")
						}
					},
					receiveValue: { [weak self] response in
						guard self != nil else { return }
						logger.console("Plaid token patch request responded with \(String(describing: response.status))")
						if let body = response.body {
							self?.appState.set(user: body.user)
							self?.appState.set(userAccounts: body.userAccounts)
							self?.appState.showHomeScreenSheet = false
							if let account = body.userAccounts.first(where: { $0.matches(plaidLinkResponse) }) {
								f(account)
							}
						}

						if response.error != nil {
							logger.error("\(String(describing: response.error))")
							showSnackbar(message: "We were unable to configure your account. Please call support at \(EnvironmentService.get(.supportPhoneNumber))")
						}

						self?.plaidPatchRequestInProgress = false
					}
				)
				.store(in: &self.disposables)
		}
	}

	func handleAccountUpdate(_ account: UserAccount) {
		plaidPatchRequestInProgress = true

		service
			.updateBankAccount(dto: UserAccountIdDto(accountId: account.id))
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { [weak self] completion in
					switch completion {
					case .finished:
						break
					case .failure(let err):
						self?.plaidPatchRequestInProgress = false
						showSnackbar(message: "We were unable to update your information. Please contact support at \(EnvironmentService.get(.supportPhoneNumber))")
						logger.error("\(err.localizedDescription)")
					}
				},
				receiveValue: { [weak self] response in
					self?.plaidPatchRequestInProgress = false
					if let account = response.body {
						self?.appState.set(userAccount: account)
						self?.appState.showHomeScreenSheet = false
						self?.appState.fetchAvailableAccounts()
					} else {
						showSnackbar(message: "We were unable to update your information. Please contact support at \(EnvironmentService.get(.supportPhoneNumber))")
					}
				}
			)
			.store(in: &disposables)
	}

	func unlinkBankAccount(_ account: UserAccount, completionHandler: @escaping (Bool) -> Void) {
		plaidPatchRequestInProgress = true

		service
			.unlinkBankAccount(dto: UserAccountIdDto(accountId: account.id))
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { [weak self] completion in
					switch completion {
					case .finished:
						break
					case .failure(let err):
						self?.plaidPatchRequestInProgress = false
						showSnackbar(message: "Unable to unlink account. Please contact support at \(EnvironmentService.get(.supportPhoneNumber))")
						logger.error("\(err.localizedDescription)")
						completionHandler(false)
					}
				},
				receiveValue: { [weak self] response in
					self?.plaidPatchRequestInProgress = false
					if let body = response.body {
						self?.appState.set(user: body.user)
						self?.appState.set(userAccounts: body.userAccounts)
						self?.appState.showHomeScreenSheet = false
						completionHandler(true)
					}

					if response.error != nil {
						logger.error("\(String(describing: response.error))")
						showSnackbar(message: "Unable to unlink account. Please call support at \(EnvironmentService.get(.supportPhoneNumber))")
						completionHandler(false)
					}

					self?.plaidPatchRequestInProgress = false
				}
			)
			.store(in: &disposables)
	}
}
