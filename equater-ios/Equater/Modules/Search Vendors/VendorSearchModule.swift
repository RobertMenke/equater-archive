//
//  VendorSearchModule.swift
//  Equater
//
//  Created by Robert B. Menke on 3/27/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation

import Foundation
import Resolver

extension Resolver {
	static func registerVendorSearchModule() {
		Resolver
			.register { VendorRestService() }
			.implements(VendorApi.self)
			.scope(.application)

		Resolver
			.register { VendorViewModel() }
			.scope(.cached)
	}
}

extension ResolverScope {
	static let vendorSearchCache = ResolverScopeCache()
}
