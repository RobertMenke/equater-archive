//
//  Event.swift
//  Equater
//
//  Created by Robert B. Menke on 1/19/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation

enum Event: String {
	case shouldRegisterDevice
	case userIsSignedIn
	case userIsSignedOut
	case emailIsConfirmed
	case agreementUpdated
	case transactionFilterSelected
}
