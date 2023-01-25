//
//  AuthenticationRestServiceFake.swift
//  Equater
//
//  Created by Robert B. Menke on 4/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation

// TODO: write base class for rest service fake
struct AuthenticationRestServiceFake: RestApiFake, AuthenticationApi {
	/// Note: This should be reset to false on the setup of every test case
	static var requestShouldFail = false

	func fetchEnvironment() -> AnyPublisher<HttpResponse<EnvironmentDetails>, AppError> {
		if AuthenticationRestServiceFake.requestShouldFail {
			return makeFailingRequest(error: AppError.networkError("Fail to retrieve data"))
		}

		return makeRequest(response: EnvironmentDetails(
			serverEnvironment: "local",
			plaidEnvironment: "sandbox"
		))
	}

	func register(_ dto: AuthenticationDto) -> AnyPublisher<HttpResponse<SignInResponse>, AppError> {
		if AuthenticationRestServiceFake.requestShouldFail {
			return makeFailingRequest(error: AppError.networkError("Fail to retrieve data"))
		}

		return makeRequest(response: SignInResponse(
			authToken: "stub",
			user: userFake,
			userAccounts: []
		))
	}

	func signIn(_ dto: AuthenticationDto) -> AnyPublisher<HttpResponse<SignInResponse>, AppError> {
		if AuthenticationRestServiceFake.requestShouldFail {
			return makeFailingRequest(error: AppError.networkError("Fail to retrieve data"))
		}

		return makeRequest(response: SignInResponse(
			authToken: "stub",
			user: userFake,
			userAccounts: [userAccountFake]
		))
	}

	func requestPasswordReset(_ dto: ResetPasswordDto) -> AnyPublisher<HttpResponse<EmptyResponse>, AppError> {
		if AuthenticationRestServiceFake.requestShouldFail {
			return makeFailingRequest(error: AppError.networkError("Fail to retrieve data"))
		}

		return makeRequest(response: EmptyResponse())
	}

	func resendEmailConfirmation(_ dto: EmailDto) -> AnyPublisher<HttpResponse<EmptyResponse>, AppError> {
		if Self.requestShouldFail {
			return makeFailingRequest(error: AppError.networkError("Fail to retrieve data"))
		}

		return makeRequest(response: EmptyResponse())
	}

	func getUser() -> AnyPublisher<HttpResponse<User>, AppError> {
		if Self.requestShouldFail {
			return makeFailingRequest(error: AppError.networkError("Fail to retrieve data"))
		}

		return makeRequest(response: userFake)
	}

	func getUserAccounts() -> AnyPublisher<HttpResponse<[UserAccount]>, AppError> {
		if Self.requestShouldFail {
			return makeFailingRequest(error: AppError.networkError("Fail to retrieve data"))
		}

		return makeRequest(response: [userAccountFake])
	}

	func patchLegalDocAcceptance(_ dto: PatchLegalDocsDto) -> AnyPublisher<HttpResponse<User>, AppError> {
		if Self.requestShouldFail {
			return makeFailingRequest(error: .networkError("Failed to retrieve data"))
		}

		return makeRequest(response: userFake)
	}

	func permanentlyDeleteAccount(_ dto: UInt) -> AnyPublisher<HttpResponse<EmptyResponse>, AppError> {
		if Self.requestShouldFail {
			return makeFailingRequest(error: .networkError("Failed to retrieve data"))
		}

		return makeRequest(response: EmptyResponse())
	}
}
