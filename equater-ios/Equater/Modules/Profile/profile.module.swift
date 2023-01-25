//
//  profile.module.swift
//  Equater
//
//  Created by Robert B. Menke on 5/17/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation
import Resolver

extension Resolver {
	static func registerProfileModule() {
		Resolver
			.register { ProfileViewModel() }
			.scope(.cached)

		Resolver
			.register { ProfileRestService() }
			.implements(ProfileApi.self)
			.scope(.application)
	}
}
