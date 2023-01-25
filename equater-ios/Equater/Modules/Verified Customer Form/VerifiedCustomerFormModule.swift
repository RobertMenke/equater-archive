//
//  VerifiedCustomerFormModule.swift
//  Equater
//
//  Created by Robert B. Menke on 1/18/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation
import Resolver

extension Resolver {
	static func registerVerifiedCustomerFormModule() {
		Resolver
			.register { VerifiedCustomerViewModel() }
			.scope(ResolverScope.verificationCache)

		Resolver
			.register { VerifiedCustomerRestService() }
			.implements(VerifiedCustomerApi.self)
			.scope(.application)

		Resolver
			.register { ProfileRestService() }
			.implements(ProfileApi.self)
			.scope(.application)
	}
}

extension ResolverScope {
	static let verificationCache = ResolverScopeCache()
}
