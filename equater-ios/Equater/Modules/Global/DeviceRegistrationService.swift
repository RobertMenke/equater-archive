//
//  PushNotificationService.swift
//  Equater
//
//  Created by Robert B. Menke on 12/24/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation
import Resolver
import SwiftEventBus
import UIKit

protocol DeviceRegistrationApi {
	func registerDeviceInBackground(withFcmToken token: String)

	func registerDevice(withFcmToken token: String) -> AnyPublisher<HttpResponse<EmptyResponse>, AppError>
}

typealias DeviceRegistrationResponse = AnyPublisher<HttpResponse<EmptyResponse>, AppError>

struct DeviceRegistrationDto: Encodable {
	let deviceModel: String
	let deviceOsVersion: String
	let deviceOsName: String
	let fcmToken: String
}

enum PushNotificationCategory: String, CaseIterable {
	case expenseAgreement = "EXPENSE_AGREEMENT"
	case expenseTransaction = "EXPENSE_TRANSACTION"
	case identityVerification = "IDENTITY_VERIFICATION"
	// A type of notification with no additional data or expected action
	case notification = "NOTIFICATION"
	case plaidAuthentication = "PLAID_AUTHENTICATION"
}

/// See https://firebase.google.com/docs/cloud-messaging/ios/client
final class DeviceRegistrationService: DeviceRegistrationApi {
	@Injected var session: URLSession
	@Injected var appState: AppState

	private var disposables = Set<AnyCancellable>()

	init() {
		SwiftEventBus.onBackgroundThread(self, name: Event.userIsSignedIn.rawValue) { _ in
			if let token = self.appState.getFcmToken() {
				self.registerDeviceInBackground(withFcmToken: token)
			}
		}
	}

	/// Registers a device with an FCM token in the background. If the request fails
	/// we set a flag in UserDefaults that lets us know to re-register next time the
	/// opportunity presents itself.
	func registerDeviceInBackground(withFcmToken token: String) {
		DispatchQueue.global(qos: .default).async {
			DispatchQueue.main.async {
				self.appState.set(fcmToken: token)
			}

			self.registerDevice(withFcmToken: token)
				.receive(on: DispatchQueue.main)
				.sink(
					receiveCompletion: { [weak self] value in
						guard self != nil else {
							self?.appState.set(deviceIsRegistered: false)
							return
						}
						switch value {
						case .failure(let err):
							logger.error("REGISTRATION ERROR \(err.localizedDescription)")
							self?.appState.set(deviceIsRegistered: false)
						case .finished:
							logger.info("Successfully registered device")
							self?.appState.set(deviceIsRegistered: true)
						}
					},
					receiveValue: { _ in }
				)
				.store(in: &self.disposables)
		}
	}

	func registerDevice(withFcmToken token: String) -> AnyPublisher<HttpResponse<EmptyResponse>, AppError> {
		let dto = createDto(withFcmToken: token)
		let request = HttpRequest<DeviceRegistrationDto, EmptyResponse>()

		return request.createResponseStream(
			apiEndpoint: .registerDevice,
			httpMethod: .put,
			requestDto: dto
		)
	}

	private func createDto(withFcmToken token: String) -> DeviceRegistrationDto {
		let device = UIDevice.current

		return DeviceRegistrationDto(
			deviceModel: device.model,
			deviceOsVersion: device.systemVersion,
			deviceOsName: device.systemName,
			fcmToken: token
		)
	}
}
