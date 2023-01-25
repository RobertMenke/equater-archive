//
//  LinkBankAccountModule.swift
//  Equater
//
//  Created by Robert B. Menke on 1/18/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation
import Resolver

extension Resolver {
	static func registerLinkBankAccountModule() {
		Resolver
			.register { PlaidViewModel() }
			.scope(.cached)

		Resolver
			.register { PlaidRestService() }
			.implements(PlaidRestApi.self)
			.scope(.application)
	}
}
