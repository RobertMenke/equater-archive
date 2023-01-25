//
//  EnvironmentService.swift
//  Equater
//
//  Created by Robert B. Menke on 9/28/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Foundation
import LinkKit

struct EnvironmentService {
	static let properties: [String: Any] = {
		guard let dict = Bundle.main.infoDictionary else {
			fatalError("Plist config file not found")
		}

		return dict
	}()

	enum Configuration: String, CaseIterable {
		case apiBase = "API_BASE"
		case webBase = "WEB_BASE"
		case supportPhoneNumber = "SUPPORT_PHONE_NUMBER"
		case supportPhoneNumberE164 = "SUPPORT_PHONE_NUMBER_E164"
		case supportEmailAddress = "SUPPORT_EMAIL_ADDRESS"
		case googleApiKey = "GOOGLE_API_KEY"
		case dataDogClientKey = "DATA_DOG_API_KEY"
		case environment = "ENVIRONMENT"
		case gcmMessageKeyId = "GCM_MESSAGE_KEY_ID"

		static func value(for key: Configuration) throws -> String {
			guard let item = EnvironmentService.properties[key.rawValue] as? String else {
				throw AppError.configurationError
			}

			return item
		}
	}

	static func get(_ configValue: Configuration) -> String {
		do {
			return try Configuration.value(for: configValue)
		} catch let err {
			print(err.localizedDescription)
			return ""
		}
	}

	func get(_ configValue: Configuration) -> String {
		do {
			return try Configuration.value(for: configValue)
		} catch let err {
			print(err.localizedDescription)
			return ""
		}
	}

	func getPlaidEnv(_ value: String) -> PLKEnvironment {
		switch value.lowercased() {
		case "sandbox":
			return .sandbox
		case "development":
			return .development
		case "production":
			return .production
		default:
			fatalError("Plaid environment is misconfigured. Received \(value)")
		}
	}

	func getApiEndpoint(_ endpoint: ApiEndpoint) -> String {
		getApiBase() + endpoint.getUrl()
	}

	func getApiEndpoint(_ endpoint: ApiEndpoint) throws -> URL {
		try getUrl(endpoint: getApiEndpoint(endpoint))
	}

	func getUrl(endpoint: String) throws -> URL {
		let fullUrl = getApiBase() + endpoint

		guard let url = URL(string: fullUrl) else {
			throw AppError.malformedUrlError("Invalid URL \(fullUrl)")
		}

		return url
	}

	func getWebUrl(endpoint: String) throws -> URL {
		let fullUrl = get(.webBase) + endpoint

		guard let url = URL(string: fullUrl) else {
			throw AppError.malformedUrlError("Invalid URL \(fullUrl)")
		}

		return url
	}

	private func getApiBase() -> String {
		do {
			return try Configuration.value(for: .apiBase)
		} catch let err {
			print(err.localizedDescription)
			return ""
		}
	}
}
