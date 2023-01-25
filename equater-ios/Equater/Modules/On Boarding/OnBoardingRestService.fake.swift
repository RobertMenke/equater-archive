//
//  OnBoardingRestServiceFake.swift
//  Equater
//
//  Created by Robert B. Menke on 1/17/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation

struct OnBoardingRestServiceFake: OnBoardingApi, RestApiFake {
	static var requestShouldFail = false

	func sendFeedback(_ dto: OnBoardingFeedback) -> AnyPublisher<HttpResponse<User>, AppError> {
		if Self.requestShouldFail {
			return makeFailingRequest(error: AppError.networkError("Fail to retrieve data"))
		}

		return makeRequest(response: userFake)
	}
}
