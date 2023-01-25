//
//  LocalAuthenticationService.swift
//  Equater
//
//  Created by Robert B. Menke on 8/6/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation
import LocalAuthentication

/// The available states of being logged in or not.
enum LocalAuthenticationState {
	case loggedIn, loggedOut
}

/// Adapted from
/// https://developer.apple.com/documentation/localauthentication/logging_a_user_into_your_app_with_face_id_or_touch_id
final class LocalAuthenticationService {
	func authenticate(_ onStateConfirmed: @escaping (LocalAuthenticationState) -> Void) {
		let context = LAContext()
		var error: NSError?
		context.localizedCancelTitle = "Enter email/password"
		// First check if we have the needed hardware support.
		if context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) {
			let reason = "Log in to your account"
			context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: reason) { success, error in
				if success {
					// Move to the main thread because a state update triggers UI changes.
					DispatchQueue.main.async {
						onStateConfirmed(.loggedIn)
					}
				} else {
					logger.error("Face id or fingerprint scanning failed. Falling back to username/password.", error: error)
					DispatchQueue.main.async {
						onStateConfirmed(.loggedOut)
					}
				}
			}
		} else {
			logger.error("No hardware support for face id or fingerprint scanning. Falling back to username/password. \(String(describing: error))")
			DispatchQueue.main.async {
				onStateConfirmed(.loggedOut)
			}
		}
	}
}
