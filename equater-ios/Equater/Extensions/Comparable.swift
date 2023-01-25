//
//  Comparable.swift
//  Equater
//
//  Created by Robert B. Menke on 6/13/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation

extension Comparable {
	func clamped(_ f: Self, _ t: Self) -> Self {
		var r = self
		if r < f { r = f }
		if r > t { r = t }
		return r
	}
}
