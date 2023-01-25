//
//  HttpResponse.swift
//  Equater
//
//  Created by Robert B. Menke on 1/21/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation

protocol HttpResponseHandler {
	associatedtype Body: Decodable

	func onSuccess(_ f: (Body) -> Void) -> Self
	func onError(_ f: (String) -> Void) -> Self
}

// MARK: - HttpResponse

struct HttpResponse<T: Decodable>: HttpResponseHandler {
	typealias Body = T

	let status: Int
	var error: String? = nil
	var body: T? = nil

	static func mapResponse(data: Data, response: URLResponse) throws -> HttpResponse<T> {
		do {
			let httpResponse = response as! HTTPURLResponse
			let decoder = JSONDecoder()
			if 200 ... 299 ~= httpResponse.statusCode {
				if T.self == EmptyResponse.self {
					return HttpResponse(status: httpResponse.statusCode, body: nil)
				}

				return HttpResponse(
					status: httpResponse.statusCode,
					body: try decoder.decode(T.self, from: data)
				)
			}

			let error = try? decoder.decode(ErrorResponse.self, from: data)

			return HttpResponse(
				status: httpResponse.statusCode,
				error: error?.message ?? ErrorResponse.defaultErrorMessage
			)
		} catch let DecodingError.dataCorrupted(context) {
			logger.error("\(context.debugDescription) -- codingPath: \(context.codingPath)")
			throw AppError.defaultError
		} catch let DecodingError.keyNotFound(key, context) {
			logger.error("\(context.debugDescription) -- codingPath: \(context.codingPath) -- \(key)")
			throw AppError.defaultError
		} catch let err {
			logger.error(err.localizedDescription, error: err)
			throw AppError.defaultError
		}
	}

	static func mapEmptyResponse(data: Data, response: URLResponse) -> HttpResponse<EmptyResponse> {
		let httpResponse = response as! HTTPURLResponse

		if 200 ... 299 ~= httpResponse.statusCode {
			return HttpResponse<EmptyResponse>(
				status: httpResponse.statusCode,
				body: EmptyResponse()
			)
		}

		return HttpResponse<EmptyResponse>(
			status: httpResponse.statusCode,
			error: ErrorResponse.defaultErrorMessage
		)
	}

	func onSuccess(_ f: (Body) -> Void) -> HttpResponse<T> {
		if let body = body {
			f(body)
		}

		return self
	}

	func onError(_ f: (String) -> Void) -> HttpResponse<T> {
		if let error = error {
			f(error)
		}

		return self
	}

	func requiresEmailConfirmation() -> Bool {
		error == "email-confirmation-required"
	}
}
