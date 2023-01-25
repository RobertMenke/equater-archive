//
//  Errors.swift
//  Equater
//
//  Created by Robert B. Menke on 9/7/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Foundation
import Validator

enum AppError: LocalizedError {
	case defaultError
	case networkError(_ message: String)
	case malformedUrlError(_ message: String)
	case illegalArgument(_ message: String)
	case parseError(_ message: String)
	case plaidError(_ message: String)
	case illegalState(_ message: String)
	case unauthenticated(_ message: String)
	case inputError(_ message: String)
	case emailConfirmationRequired
	case hasExistingAgreement
	case configurationError

	var errorDescription: String? {
		switch self {
		case .defaultError:
			return "Oops! We may have messed up. Give us a call at \(EnvironmentService.get(.supportPhoneNumber))."
		case .networkError(let message):
			return message
		case .malformedUrlError(let message):
			return message
		case .illegalArgument(let message):
			return message
		case .parseError(let message):
			return message
		case .plaidError(let message):
			return message
		case .illegalState(let message):
			return message
		case .unauthenticated(let message):
			return message
		case .inputError(let message):
			return message
		case .emailConfirmationRequired:
			return "Please confirm your email to proceed"
		case .hasExistingAgreement:
			return "You already have an agreement for this merchant"
		case .configurationError:
			return "The xcconfig has not been configured properly. This error should only exist in development."
		}
	}
}

struct InputError: ValidationError {
	var message: String

	init(_ message: String) {
		self.message = message
	}
}
