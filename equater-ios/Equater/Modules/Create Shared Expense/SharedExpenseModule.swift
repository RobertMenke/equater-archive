//
//  SharedExpenseModule.swift
//  Equater
//
//  Created by Robert B. Menke on 5/24/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation
import Resolver

extension Resolver {
	static func registerSharedExpenseModule() {
		Resolver
			.register { SharedExpenseRestService() }
			.implements(SharedExpenseApi.self)
			.scope(.application)

		Resolver
			.register { MerchantExpenseViewModel() }
			.scope(ResolverScope.merchantExpenseCache)

		Resolver
			.register { RecurringExpenseViewModel() }
			.scope(ResolverScope.recurringExpenseCache)
	}
}

extension ResolverScope {
	static let merchantExpenseCache = ResolverScopeCache()
	static let recurringExpenseCache = ResolverScopeCache()
}
