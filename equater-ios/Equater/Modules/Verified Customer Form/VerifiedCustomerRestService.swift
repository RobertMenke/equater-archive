//
//  VerifiedCustomerRestService.swift
//  Equater
//
//  Created by Robert B. Menke on 10/14/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation
import Resolver

protocol VerifiedCustomerApi {
	func updateProfile(_ dto: RecipientOfFundsFormDto) -> AnyPublisher<HttpResponse<User>, AppError>

	func updateAddress(_ dto: PatchAddressDto) -> AnyPublisher<HttpResponse<User>, AppError>
}

struct VerifiedCustomerRestService: VerifiedCustomerApi {
	@Injected var session: URLSession

	func updateProfile(_ dto: RecipientOfFundsFormDto) -> AnyPublisher<HttpResponse<User>, AppError> {
		let request = HttpRequest<RecipientOfFundsFormDto, User>()

		return request.createResponseStream(
			apiEndpoint: .recipientOfFunds,
			httpMethod: .patch,
			requestDto: dto
		)
	}

	func updateAddress(_ dto: PatchAddressDto) -> AnyPublisher<HttpResponse<User>, AppError> {
		let request = HttpRequest<PatchAddressDto, User>()

		return request.patch(apiEndpoint: .patchAddress, requestDto: dto)
	}
}
