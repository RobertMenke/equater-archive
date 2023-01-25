//
//  OnBoardingRestService.swift
//  Equater
//
//  Created by Robert B. Menke on 1/17/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation

struct OnBoardingFeedback: Codable {
	var selection: OnBoardingOption
	var additionalFeedback: String?
}

protocol OnBoardingApi {
	func sendFeedback(_ dto: OnBoardingFeedback) -> AnyPublisher<HttpResponse<User>, AppError>
}

struct OnBoardingRestService: OnBoardingApi {
	func sendFeedback(_ dto: OnBoardingFeedback) -> AnyPublisher<HttpResponse<User>, AppError> {
		let request = HttpRequest<OnBoardingFeedback, User>()

		return request.patch(apiEndpoint: .patchOnBoardingFeedback, requestDto: dto)
	}
}
