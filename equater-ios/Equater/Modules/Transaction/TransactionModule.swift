//
//  TransactionModule.swift
//  Equater
//
//  Created by Robert B. Menke on 7/4/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation
import Resolver

extension Resolver {
	static func registerTransactionModule() {
		Resolver
			.register { TransactionViewModel() }
			.scope(.cached)
	}
}
