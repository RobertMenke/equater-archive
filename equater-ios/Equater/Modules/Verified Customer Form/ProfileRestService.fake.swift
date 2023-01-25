//
//  ProfileRestService.fake.swift
//  Equater
//
//  Created by Robert B. Menke on 4/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation

class VerifiedCustomerRestServiceFake: RestApiFake, VerifiedCustomerApi {
	/// Note: This should be reset to false on the setup of every test case
	static var requestShouldFail = false

	func updateProfile(_ dto: RecipientOfFundsFormDto) -> AnyPublisher<HttpResponse<User>, AppError> {
		if VerifiedCustomerRestServiceFake.requestShouldFail {
			return makeFailingRequest(error: .networkError("Request failed"))
		}

		return makeRequest(response: userFake)
	}

	func updateAddress(_ dto: PatchAddressDto) -> AnyPublisher<HttpResponse<User>, AppError> {
		if Self.requestShouldFail {
			return makeFailingRequest(error: .networkError("Request failed"))
		}

		return makeRequest(response: userFake)
	}
}
