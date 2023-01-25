//
//  PlaidModal.swift
//  Equater
//
//  Created by Robert B. Menke on 8/18/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Bow
import DictionaryCoding
import LinkKit
import Resolver
import SwiftUI

let plaidErrorMessage = "Please link your account to continue."

enum PlaidLinkResponse {
	case success(_ response: PlaidLinkJson)
	case error(_ error: AppError)
}

enum PlaidLinkUpdateResponse {
	case success
	case error(_ error: AppError)
}

struct PlaidTokenContext {
	let isUpdate: Bool
	let plaidToken: String
	let account: UserAccount?
}

public struct PlaidConfiguration {
	@Injected var environmentService: EnvironmentService
	@InjectedObject var appState: AppState
	/// Token generated using the Plaid SDK server-side. Can be an update on an existing user account
	/// or a token for a brand new account.
	let token: String
	let callback: (PlaidLinkResponse) -> Void
	private var handler: LinkKit.Handler?

	init(_ token: String, _ f: @escaping (PlaidLinkResponse) -> Void) {
		callback = f
		self.token = token
	}

	func makePlaidHandler() -> LinkKit.Handler? {
		guard let config = createLinkKitConfiguration() else { return nil }
		let plaid = Plaid.create(config)

		switch plaid {
		case .failure(let error):
			logger.error("Unable to create plaid handler due to: \(error)")
			return nil
		case .success(let handler):
			return handler
		}
	}

	private func createLinkKitConfiguration() -> LinkTokenConfiguration? {
		var configuration = LinkTokenConfiguration(
			token: token,
			onSuccess: { result in
				self.callback(self.createPlaidLinkResponse(result.publicToken, metaData: result.metadata))
			}
		)

		let errorHandler: LinkKit.OnExitHandler = { event in
			logger.error("Plaid failed \(event.error?.localizedDescription ?? "unknown error")")
			let errorOption = AppError.plaidError(event.error?.localizedDescription ?? plaidErrorMessage)
			self.callback(.error(errorOption))
		}

		configuration.onExit = errorHandler

		return configuration
	}

	private func createPlaidLinkResponse(
		_ publickKey: String,
		metaData: SuccessMetadata?
	) -> PlaidLinkResponse {
		guard let data = metaData, let jsonString = data.metadataJSON?.utf8 else {
			logger.info("Did not receive meta data from Plaid")
			return .error(AppError.plaidError(plaidErrorMessage))
		}

		do {
			print("\(String(describing: data.metadataJSON))")
			let decoder = JSONDecoder()
			decoder.keyDecodingStrategy = .convertFromSnakeCase
			let plaidMetaData = try decoder.decode(PlaidMetaData.self, from: Data(jsonString))

			return .success(PlaidLinkJson(
				token: publickKey,
				metaData: plaidMetaData
			))
		} catch let err {
			logger.error("Error decoding PlaidMetaData \(err)")
			return .error(AppError.plaidError(plaidErrorMessage))
		}
	}
}

/// Used only when a user needs to re-authenticate with Plaid
public struct PlaidUpdateConfiguration {
	@Injected var environmentService: EnvironmentService
	@InjectedObject var appState: AppState
	/// Token generated using the Plaid SDK server-side. Can be an update on an existing user account
	/// or a token for a brand new account.
	let token: String
	let callback: (PlaidLinkUpdateResponse) -> Void
	private var handler: LinkKit.Handler?

	init(_ token: String, _ f: @escaping (PlaidLinkUpdateResponse) -> Void) {
		self.token = token
		callback = f
	}

	func makePlaidHandler() -> LinkKit.Handler? {
		guard let config = createLinkKitConfiguration() else { return nil }
		let plaid = Plaid.create(config)

		switch plaid {
		case .failure(let error):
			logger.error("Unable to create plaid handler due to: \(error)")
			return nil
		case .success(let handler):
			return handler
		}
	}

	private func createLinkKitConfiguration() -> LinkTokenConfiguration? {
		var configuration = LinkTokenConfiguration(
			token: token,
			onSuccess: { _ in
				self.callback(.success)
			}
		)

		let errorHandler: LinkKit.OnExitHandler = { event in
			logger.error("Plaid failed \(event.error?.localizedDescription ?? "unknown error")")
			let errorOption = AppError.plaidError(event.error?.localizedDescription ?? plaidErrorMessage)
			self.callback(.error(errorOption))
		}

		configuration.onExit = errorHandler

		return configuration
	}
}
