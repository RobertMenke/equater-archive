//
//  AuthenticationRestService.swift
//  Equater
//
//  Created by Robert B. Menke on 9/8/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation
import Resolver

typealias RestResponse = URLSession.DataTaskPublisher.Output

protocol AuthenticationApi {
	func fetchEnvironment() -> AnyPublisher<HttpResponse<EnvironmentDetails>, AppError>
	func register(_ dto: AuthenticationDto) -> AnyPublisher<HttpResponse<SignInResponse>, AppError>
	func signIn(_ dto: AuthenticationDto) -> AnyPublisher<HttpResponse<SignInResponse>, AppError>
	func requestPasswordReset(_ dto: ResetPasswordDto) -> AnyPublisher<HttpResponse<EmptyResponse>, AppError>
	func resendEmailConfirmation(_ dto: EmailDto) -> AnyPublisher<HttpResponse<EmptyResponse>, AppError>
	func getUser() -> AnyPublisher<HttpResponse<User>, AppError>
	func getUserAccounts() -> AnyPublisher<HttpResponse<[UserAccount]>, AppError>
	func patchLegalDocAcceptance(_ dto: PatchLegalDocsDto) -> AnyPublisher<HttpResponse<User>, AppError>
	func permanentlyDeleteAccount(_ dto: UInt) -> AnyPublisher<HttpResponse<EmptyResponse>, AppError>
}

struct AuthenticationRestService: AuthenticationApi {
	func fetchEnvironment() -> AnyPublisher<HttpResponse<EnvironmentDetails>, AppError> {
		let request = HttpRequest<EmptyRequest, EnvironmentDetails>(requiresAuth: false)

		return request.get(apiEndpoint: .fetchEnvironment)
	}

	func register(_ dto: AuthenticationDto) -> AnyPublisher<HttpResponse<SignInResponse>, AppError> {
		let request = HttpRequest<AuthenticationDto, SignInResponse>(requiresAuth: false)

		return request.put(
			apiEndpoint: .register,
			requestDto: dto
		)
	}

	func signIn(_ dto: AuthenticationDto) -> AnyPublisher<HttpResponse<SignInResponse>, AppError> {
		let request = HttpRequest<AuthenticationDto, SignInResponse>(requiresAuth: false)

		return request.post(
			apiEndpoint: .signIn,
			requestDto: dto
		)
	}

	func requestPasswordReset(_ dto: ResetPasswordDto) -> AnyPublisher<HttpResponse<EmptyResponse>, AppError> {
		let request = HttpRequest<ResetPasswordDto, EmptyResponse>(requiresAuth: false)

		return request.post(
			apiEndpoint: .passwordReset,
			requestDto: dto
		)
	}

	func resendEmailConfirmation(_ dto: EmailDto) -> AnyPublisher<HttpResponse<EmptyResponse>, AppError> {
		let request = HttpRequest<EmailDto, EmptyResponse>(requiresAuth: false)

		return request.post(apiEndpoint: .resendEmailVerification, requestDto: dto)
	}

	func getUser() -> AnyPublisher<HttpResponse<User>, AppError> {
		let request = HttpRequest<EmptyRequest, User>(requiresAuth: true)

		return request.get(apiEndpoint: .getUser)
	}

	func getUserAccounts() -> AnyPublisher<HttpResponse<[UserAccount]>, AppError> {
		let request = HttpRequest<EmptyRequest, [UserAccount]>(requiresAuth: true)

		return request.get(apiEndpoint: .getUserAccounts)
	}

	func patchLegalDocAcceptance(_ dto: PatchLegalDocsDto) -> AnyPublisher<HttpResponse<User>, AppError> {
		let request = HttpRequest<PatchLegalDocsDto, User>()

		return request.patch(apiEndpoint: .legalDocsAcceptance, requestDto: dto)
	}

	func permanentlyDeleteAccount(_ dto: UInt) -> AnyPublisher<HttpResponse<EmptyResponse>, AppError> {
		let request = HttpRequest<EmptyRequest, EmptyResponse>()

		return request.delete(apiEndpoint: .permanentlyDeleteAccount(id: dto), requestDto: EmptyRequest())
	}
}
