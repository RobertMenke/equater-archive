//
//  PlaidRestService.swift
//  Equater
//
//  Created by Robert B. Menke on 9/8/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation
import Resolver

protocol PlaidRestApi {
	func storePlaidToken(dto: PlaidLinkJson) -> AnyPublisher<HttpResponse<PatchBankAccountResponse>, AppError>

	func updateBankAccount(dto: UserAccountIdDto) -> AnyPublisher<HttpResponse<UserAccount>, AppError>

	func unlinkBankAccount(dto: UserAccountIdDto) -> AnyPublisher<HttpResponse<PatchBankAccountResponse>, AppError>
}

struct PlaidRestService: PlaidRestApi {
	@Injected var session: URLSession
	@Injected var environmentService: EnvironmentService

	func storePlaidToken(dto: PlaidLinkJson) -> AnyPublisher<HttpResponse<PatchBankAccountResponse>, AppError> {
		let request = HttpRequest<PlaidLinkJson, PatchBankAccountResponse>()

		return request.patch(apiEndpoint: .linkBankAccount, requestDto: dto)
	}

	func updateBankAccount(dto: UserAccountIdDto) -> AnyPublisher<HttpResponse<UserAccount>, AppError> {
		let request = HttpRequest<UserAccountIdDto, UserAccount>()

		return request.patch(apiEndpoint: .updateBankAccount(id: dto.accountId), requestDto: dto)
	}

	func unlinkBankAccount(dto: UserAccountIdDto) -> AnyPublisher<HttpResponse<PatchBankAccountResponse>, AppError> {
		let request = HttpRequest<UserAccountIdDto, PatchBankAccountResponse>()

		return request.patch(
			apiEndpoint: .unlinkBankAccount(id: dto.accountId),
			requestDto: dto
		)
	}
}
