//
//  HomeScreenModule.swift
//  Equater
//
//  Created by Robert B. Menke on 5/25/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation
import Resolver

extension Resolver {
	static func registerHomeScreenModule() {
		Resolver
			.register { HomeScreenViewModel() }
			.scope(.cached)
	}
}
