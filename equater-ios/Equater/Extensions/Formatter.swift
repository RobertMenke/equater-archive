//
//  Formatter.swift
//  Equater
//
//  Created by Robert B. Menke on 6/13/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation

extension Formatter {
	static let withSeparator: NumberFormatter = {
		let formatter = NumberFormatter()
		formatter.numberStyle = .decimal
		formatter.groupingSeparator = " "
		return formatter
	}()
}

extension Numeric {
	var formattedWithSeparator: String { Formatter.withSeparator.string(for: self) ?? "" }
}
