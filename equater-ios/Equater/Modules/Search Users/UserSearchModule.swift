//
//  UserSearchModule.swift
//  Equater
//
//  Created by Robert B. Menke on 1/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation
import Resolver

extension Resolver {
	static func registerUserSearchModule() {
		Resolver
			.register { UserSearchRestService() }
			.implements(UserSearchApi.self)
			.scope(.application)

		Resolver
			.register { UserSearchViewModel() }
			.scope(ResolverScope.userSearchCache)
	}
}

extension ResolverScope {
	static let userSearchCache = ResolverScopeCache()
}
