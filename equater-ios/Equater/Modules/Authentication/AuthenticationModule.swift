//
//  AuthenticationModule.swift
//  Equater
//
//  Created by Robert B. Menke on 1/18/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation
import Resolver

extension Resolver {
	static func registerAuthenticationModule() {
		Resolver
			.register { AuthenticationViewModel() }
			.scope(ResolverScope.authScope)

		Resolver
			.register { AuthenticationRestService() }
			.implements(AuthenticationApi.self)
			.scope(.application)
	}
}

extension ResolverScope {
	static let authScope = ResolverScopeCache()
}
