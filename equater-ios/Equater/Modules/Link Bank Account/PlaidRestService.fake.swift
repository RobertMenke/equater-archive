//
//  PlaidRestApiFake.swift
//  Equater
//
//  Created by Robert B. Menke on 4/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation

struct PlaidRestServiceFake: RestApiFake, PlaidRestApi {
	/// Note: This should be reset to false on the setup of every test case
	static var requestShouldFail = false

	func storePlaidToken(dto: PlaidLinkJson) -> AnyPublisher<HttpResponse<PatchBankAccountResponse>, AppError> {
		if PlaidRestServiceFake.requestShouldFail {
			return makeFailingRequest(error: AppError.networkError("Request failed"))
		}

		return makeRequest(response: PatchBankAccountResponse(
			user: userFake,
			userAccounts: [userAccountFake]
		))
	}

	func updateBankAccount(dto: UserAccountIdDto) -> AnyPublisher<HttpResponse<UserAccount>, AppError> {
		if PlaidRestServiceFake.requestShouldFail {
			return makeFailingRequest(error: AppError.networkError("Request failed"))
		}

		return makeRequest(response: userAccountFake)
	}

	func unlinkBankAccount(dto: UserAccountIdDto) -> AnyPublisher<HttpResponse<PatchBankAccountResponse>, AppError> {
		if Self.requestShouldFail {
			return makeFailingRequest(error: AppError.networkError("Request failed"))
		}

		return makeRequest(response: PatchBankAccountResponse(
			user: userFake,
			userAccounts: [userAccountFake]
		))
	}
}
