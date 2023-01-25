//
//  Array.swift
//  Equater
//
//  Created by Robert B. Menke on 11/8/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import Foundation

extension Array {
	func sum(f: (Element) -> Int) -> Int {
		var total = 0

		forEach { element in
			total += f(element)
		}

		return total
	}
}
