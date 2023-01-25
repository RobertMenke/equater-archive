//
//  SearchInput.swift
//  Equater
//
//  Created by Robert B. Menke on 1/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation
import Resolver

protocol UserSearchApi {
	func search(_ dto: UserSearchRequest) -> AnyPublisher<HttpResponse<UserSearchResponse>, AppError>

	func fetchRelationships() -> AnyPublisher<HttpResponse<[User]>, AppError>
}

struct UserSearchRestService: UserSearchApi {
	@InjectedObject var appState: AppState

	func search(_ dto: UserSearchRequest) -> AnyPublisher<HttpResponse<UserSearchResponse>, AppError> {
		let request = HttpRequest<UserSearchRequest, UserSearchResponse>()

		return request.createResponseStream(
			apiEndpoint: .searchUsers,
			httpMethod: .get,
			requestDto: dto
		)
	}

	func fetchRelationships() -> AnyPublisher<HttpResponse<[User]>, AppError> {
		guard let user = appState.user else { return HttpRequest<EmptyRequest, [User]>.defaultError() }
		let request = HttpRequest<EmptyRequest, [User]>()

		return request.get(apiEndpoint: .fetchRelationships(id: user.id))
	}
}
