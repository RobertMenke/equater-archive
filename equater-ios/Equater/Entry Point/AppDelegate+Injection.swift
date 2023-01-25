//
//  AppDelegate+Injection.swift
//  Equater
//
//  Created by Robert B. Menke on 1/18/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation
import Resolver
import SwiftEventBus

extension Resolver: ResolverRegistering {
	public static func registerAllServices() {
		registerGlobalModule()
		registerAuthenticationModule()
		registerOnBoardingModule()
		registerLinkBankAccountModule()
		registerProfilePhotoModule()
		registerVerifiedCustomerFormModule()
		registerUserSearchModule()
		registerVendorSearchModule()
		registerProfileModule()
		registerSharedExpenseModule()
		registerManageAgreementsModule()
		registerSupportModule()
		registerHomeScreenModule()
		registerTransactionModule()
	}
}
