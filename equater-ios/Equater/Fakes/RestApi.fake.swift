//
//  RestApiFake.swift
//  Equater
//
//  Created by Robert B. Menke on 4/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation

/// Only use this protocol when testing
protocol RestApiFake {
	func makeRequest<Response: Decodable>(response: Response) -> AnyPublisher<HttpResponse<Response>, AppError>
	func makeFailingRequest<Response: Decodable>(error: AppError) -> AnyPublisher<HttpResponse<Response>, AppError>
}

/// Adds a default implementation that allows consumers of this protocol to make fake requests
extension RestApiFake {
	/// Make a successful request with a faked response body
	func makeRequest<Response: Decodable>(response: Response) -> AnyPublisher<HttpResponse<Response>, AppError> {
		let httpResponse = HttpResponse(status: 200, error: nil, body: response)
		let publisher = Just<HttpResponse<Response>>(httpResponse)

		return publisher
			.setFailureType(to: AppError.self)
			.eraseToAnyPublisher()
	}

	/// Fails with a given error. Useful when attempting to handle errors that may be thrown by an API
	func makeFailingRequest<Response: Decodable>(error: AppError) -> AnyPublisher<HttpResponse<Response>, AppError> {
		let fail = Fail<HttpResponse<Response>, AppError>(error: error)

		return fail.eraseToAnyPublisher()
	}
}
