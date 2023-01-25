//
//  HttpRequest.swift
//  Equater
//
//  Created by Robert B. Menke on 1/21/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation
import Resolver

/// Reduces boilerplate for regular http requests.
struct HttpRequest<RequestDto: Encodable, ResponseDto: Decodable> {
	@Injected var environmentService: EnvironmentService
	@Injected var appState: AppState
	@Injected var urlSession: URLSession

	private let requiresAuth: Bool

	init(requiresAuth auth: Bool = true) {
		requiresAuth = auth
	}

	static func defaultError() -> AnyPublisher<HttpResponse<ResponseDto>, AppError> {
		Result
			.failure(AppError.defaultError)
			.publisher
			.eraseToAnyPublisher()
	}

	func get(apiEndpoint endpoint: ApiEndpoint, requestDto dto: RequestDto? = nil) -> AnyPublisher<HttpResponse<ResponseDto>, AppError> {
		createResponseStream(apiEndpoint: endpoint, httpMethod: .get, requestDto: dto)
	}

	func patch(apiEndpoint endpoint: ApiEndpoint, requestDto dto: RequestDto) -> AnyPublisher<HttpResponse<ResponseDto>, AppError> {
		createResponseStream(apiEndpoint: endpoint, httpMethod: .patch, requestDto: dto)
	}

	func put(apiEndpoint endpoint: ApiEndpoint, requestDto dto: RequestDto) -> AnyPublisher<HttpResponse<ResponseDto>, AppError> {
		createResponseStream(apiEndpoint: endpoint, httpMethod: .put, requestDto: dto)
	}

	func post(apiEndpoint endpoint: ApiEndpoint, requestDto dto: RequestDto) -> AnyPublisher<HttpResponse<ResponseDto>, AppError> {
		createResponseStream(apiEndpoint: endpoint, httpMethod: .post, requestDto: dto)
	}

	func delete(apiEndpoint endpoint: ApiEndpoint, requestDto dto: RequestDto) -> AnyPublisher<HttpResponse<ResponseDto>, AppError> {
		createResponseStream(apiEndpoint: endpoint, httpMethod: .delete, requestDto: dto)
	}

	func createResponseStream(
		apiEndpoint endpoint: ApiEndpoint,
		httpMethod method: HttpRequestMethod,
		requestDto dto: RequestDto? = nil
	) -> AnyPublisher<HttpResponse<ResponseDto>, AppError> {
		do {
			let url: String = environmentService.getApiEndpoint(endpoint)
			let request = try createUrlRequest(method: method, url: url, payload: dto)

			return urlSession
				.dataTaskPublisher(for: request)
				.tryMap { (data: Data, response: URLResponse) -> HttpResponse<ResponseDto> in
					try HttpResponse.mapResponse(data: data, response: response)
				}
				.mapError {
					logger.error("HTTP Error -- \($0.localizedDescription)", error: $0, attributes: [
						"endpoint": endpoint.getUrl(),
					])
					return .networkError($0.localizedDescription)
				}
				.eraseToAnyPublisher()
		} catch let err {
			logger.error("\(err.localizedDescription)", error: err)
			return Result
				.failure(AppError.networkError(err.localizedDescription))
				.publisher
				.eraseToAnyPublisher()
		}
	}

	private func createUrlRequest(method: HttpRequestMethod, url: String, payload: RequestDto? = nil) throws -> URLRequest {
		let authToken = appState.authToken

		if requiresAuth, authToken == nil {
			throw AppError.illegalState("Please sign in to continue")
		}

		switch method {
		case .get:
			return try createGetRequest(endpoint: url, authToken: authToken, requestDto: payload)
		case .post, .put, .patch, .delete:
			guard let body = payload else {
				throw AppError.illegalArgument("Dto not supplied to http request")
			}

			return try createRequestWithBody(endpoint: url, body: body, requestMethod: method, authToken: authToken)
		}
	}

	private func createRequestWithBody<T: Encodable>(
		endpoint: String,
		body: T,
		requestMethod: HttpRequestMethod,
		authToken: String? = nil
	) throws -> URLRequest {
		guard let url = URL(string: endpoint) else { throw AppError.malformedUrlError("\(endpoint) could not be parsed") }
		var request = URLRequest(url: url)
		request.httpMethod = requestMethod.rawValue
		request.httpBody = try encode(body)
		request.setValue("Application/json", forHTTPHeaderField: "Content-Type")
		if let token = authToken {
			request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
		}

		return request
	}

	private func createGetRequest(
		endpoint: String,
		authToken: String? = nil,
		requestDto dto: RequestDto? = nil
	) throws -> URLRequest {
		let params = try encodeUrlParams(dto)
		guard let url = URL(string: "\(endpoint)\(params)") else { throw AppError.malformedUrlError("\(endpoint) could not be parsed") }

		var request = URLRequest(url: url)
		request.httpMethod = HttpRequestMethod.get.rawValue

		if let token = authToken {
			request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
		}

		return request
	}

	private func encode<T: Encodable>(_ dto: T) throws -> Data {
		let encoder = JSONEncoder()
		encoder.dateEncodingStrategy = .iso8601

		return try encoder.encode(dto)
	}

	/// If a DTO is supplied to a get request, convert the DTO to query params
	private func encodeUrlParams<T: Encodable>(_ dto: T?) throws -> String {
		if let params = dto {
			let encoder = QueryParamEncoder()
			return try encoder.encode(params)
		}

		return ""
	}
}
