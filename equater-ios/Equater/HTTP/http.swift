//
//  http.swift
//  Equater
//
//  Created by Robert B. Menke on 1/21/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation

enum HttpRequestMethod: String {
	case post = "POST"
	case patch = "PATCH"
	case put = "PUT"
	case get = "GET"
	case delete = "DELETE"
}

struct EmptyRequest: Codable {}
struct EmptyResponse: Codable {}
struct ErrorResponse: Decodable {
	let message: String

	static var defaultErrorMessage: String {
		"Hmm, something went wrong. Give us a call at \(EnvironmentService.get(.supportPhoneNumber)). Our engineers have logged the issue and will help you get things working."
	}
}
