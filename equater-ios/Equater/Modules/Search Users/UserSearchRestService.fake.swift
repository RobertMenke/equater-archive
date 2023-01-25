//
//  UserSearchRestService.fake.swift
//  Equater
//
//  Created by Robert B. Menke on 4/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation

class UserSearchRestServiceFake: RestApiFake, UserSearchApi {
	/// Note: This should be reset to false on the setup of every test case
	static var requestShouldFail = false

	func search(_ dto: UserSearchRequest) -> AnyPublisher<HttpResponse<UserSearchResponse>, AppError> {
		if UserSearchRestServiceFake.requestShouldFail {
			return makeFailingRequest(error: AppError.networkError("Request failed"))
		}

		return makeRequest(response: UserSearchResponse(
			friends: [userFake],
			users: [userFake]
		)
		)
	}

	func fetchRelationships() -> AnyPublisher<HttpResponse<[User]>, AppError> {
		if Self.requestShouldFail {
			return makeFailingRequest(error: AppError.networkError("Request failed"))
		}

		return makeRequest(response: [userFake])
	}
}
