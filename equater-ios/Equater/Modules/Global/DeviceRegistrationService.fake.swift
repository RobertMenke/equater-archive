//
//  DeviceRegistration.fake.swift
//  Equater
//
//  Created by Robert B. Menke on 4/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation

class DeviceRegistrationServiceFake: RestApiFake, DeviceRegistrationApi {
	/// Note: This should be reset to false on the setup of every test case
	static var requestShouldFail = false
	var disposables = Set<AnyCancellable>()

	func registerDeviceInBackground(withFcmToken token: String) {
		DispatchQueue.main.async {
			self.registerDevice(withFcmToken: token).sink(
				receiveCompletion: { _ in
					print(#function)
				},
				receiveValue: { _ in
					print(#function)
				}
			)
			.store(in: &self.disposables)
		}
	}

	func registerDevice(withFcmToken token: String) -> AnyPublisher<HttpResponse<EmptyResponse>, AppError> {
		if DeviceRegistrationServiceFake.requestShouldFail {
			return makeFailingRequest(error: AppError.networkError("Request failed"))
		}

		return makeRequest(response: EmptyResponse())
	}
}
