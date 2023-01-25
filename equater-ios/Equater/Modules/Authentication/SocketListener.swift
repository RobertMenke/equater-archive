//
//  SocketListener.swift
//  Equater
//
//  Created by Robert B. Menke on 10/4/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation
import Resolver
import SocketIO
import SwiftEventBus

enum SocketEvent: String {
	case emailConfirmed = "EMAIL_CONFIRMED"
	case agreementUpdated = "AGREEMENT_UPDATED"
	case agreementCreated = "AGREEMENT_CREATED"
	case transactionUpdated = "TRANSACTION_UPDATED"
	case userUpdated = "USER_UPDATED"
}

/// Currently we're forced to connect over the V3 protocol even though our server supports V4
/// https://github.com/socketio/socket.io-client-swift/blob/master/Usage%20Docs/Compatibility.md
/// https://github.com/socketio/socket.io-client-swift/issues/1378
/// https://github.com/socketio/socket.io-client-swift/issues/1355
class SocketListener {
	@Injected private var appState: AppState
	@InjectedObject private var agreementViewModel: AgreementsViewModel
	@InjectedObject private var transactionViewModel: TransactionViewModel
	var manager: SocketManager?

	private init() {}

	class func withAuthToken(authToken: String) throws -> SocketListener {
		let instance = SocketListener()
		let environmentService = Resolver.resolve(EnvironmentService.self)

		if let url = URL(string: "\(environmentService.get(.apiBase))") {
			instance.manager = SocketManager(
				socketURL: url,
				config: [
					.compress,
					.forceWebsockets(true),
					// EIO 3 required to connect over V3 of the protocol (server is on V4, but client lib is behind)
					// https://github.com/socketio/socket.io-client-swift/issues/1355
					.connectParams(["token": authToken, "EIO": "3"]),
					.log(false),
				]
			)

			return instance
		}

		throw AppError.configurationError
	}

	func createEventListeners() {
		_ = onEmailConfirmation()
			.onAgreementUpdated()
			.onAgreementCreated()
			.onTransactionUpdated()
			.onUserUpdated()

		manager?.connect()
	}

	func disconnect() {
		manager?.disconnect()
	}

	private func onEmailConfirmation() -> Self {
		handleEvent(event: .emailConfirmed, payload: User.self) { user in
			self.appState.set(user: user)
			SwiftEventBus.post(Event.emailIsConfirmed.rawValue)
		}

		return self
	}

	private func onAgreementUpdated() -> Self {
		handleEvent(event: .agreementUpdated, payload: SharedExpenseStory.self) { story in
			self.agreementViewModel.addOrReplace(story: story)
		}

		return self
	}

	private func onAgreementCreated() -> Self {
		handleEvent(event: .agreementCreated, payload: SharedExpenseStory.self) { story in
			self.agreementViewModel.addOrReplace(story: story)
		}

		return self
	}

	private func onTransactionUpdated() -> Self {
		handleEvent(event: .transactionUpdated, payload: TransactionStory.self) { story in
			self.transactionViewModel.addOrReplace(story)
		}

		return self
	}

	private func onUserUpdated() -> Self {
		handleEvent(event: .userUpdated, payload: User.self) { user in
			self.appState.set(user: user)
		}

		return self
	}

	/// Generic event handler definition
	private func handleEvent<T: Codable>(event: SocketEvent, payload: T.Type, callback: @escaping (T) -> Void) {
		manager?.defaultSocket.on(event.rawValue) { data, _ in
			let decoder = JSONDecoder()
			if data.count > 0,
			   let msg = data[0] as? String,
			   let dataMsg = msg.data(using: .utf8),
			   let value = try? decoder.decode(T.self, from: dataMsg)
			{
				callback(value)
			}
		}
	}
}
