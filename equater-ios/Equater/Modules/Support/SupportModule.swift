//
//  SupportModule.swift
//  Equater
//
//  Created by Robert B. Menke on 5/24/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation
import Resolver

extension Resolver {
	static func registerSupportModule() {
		Resolver
			.register { SupportViewModel() }
			.scope(.cached)
	}
}
