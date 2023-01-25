//
//  ProfileRestService.swift
//  Equater
//
//  Created by Robert B. Menke on 5/17/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation
import Resolver

protocol ProfileApi {
	func patchName(_ dto: ProfileDto) -> AnyPublisher<HttpResponse<User>, AppError>

	func getBalance() -> AnyPublisher<HttpResponse<[Balance]>, AppError>
}

struct ProfileRestService: ProfileApi {
	@Injected var session: URLSession

	func patchName(_ dto: ProfileDto) -> AnyPublisher<HttpResponse<User>, AppError> {
		let request = HttpRequest<ProfileDto, User>()

		return request.patch(apiEndpoint: .patchName, requestDto: dto)
	}

	func getBalance() -> AnyPublisher<HttpResponse<[Balance]>, AppError> {
		let request = HttpRequest<EmptyRequest, [Balance]>()

		return request.get(apiEndpoint: .getUserBalance)
	}
}
