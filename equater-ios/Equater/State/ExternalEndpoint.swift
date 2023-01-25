//
//  ExternalEndpoint.swift
//  Equater
//
//  Created by Robert B. Menke on 9/28/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Foundation
import Resolver

enum ExternalEndpoints: String {
	case plaidWebhook = "/plaid/webhook"
	@Injected static var appState: AppState
	@Injected static var environmentService: EnvironmentService

	func getUrl() throws -> URL {
		switch self {
		case .plaidWebhook:
			guard let user = ExternalEndpoints.appState.user else {
				throw AppError.illegalState("Attempt to create plaid webhook url using unauthenticated user")
			}
			let fullUrl = rawValue + "/\(user.id)"
			return try ExternalEndpoints.environmentService.getUrl(endpoint: fullUrl)
		}
	}
}
