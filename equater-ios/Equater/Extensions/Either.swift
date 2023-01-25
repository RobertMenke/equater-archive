//
//  Either.swift
//  Equater
//
//  Created by Robert B. Menke on 5/31/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Bow
import Foundation

extension Either {
	func compactLeft<C>(_ f: (A) -> C) -> C? {
		fold({ f($0) }, { _ in nil })
	}

	func compactRight<C>(_ f: (B) -> C) -> C? {
		fold({ _ in nil }, { f($0) })
	}

	func effectRight(_ f: (B) -> Void) -> Either<A, B> {
		fold({ _ in }, { f($0) })
		return self
	}

	func effectLeft(_ f: (A) -> Void) -> Either<A, B> {
		fold({ f($0) }, { _ in })
		return self
	}
}
