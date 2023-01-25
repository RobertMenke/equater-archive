//
//  OnBoardingModule.swift
//  Equater
//
//  Created by Robert B. Menke on 1/18/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation
import Resolver

extension Resolver {
	static func registerOnBoardingModule() {
		Resolver
			.register { OnBoardingViewModel() }
			.scope(.cached)

		Resolver
			.register { OnBoardingRestService() }
			.implements(OnBoardingApi.self)
			.scope(.application)
	}
}
