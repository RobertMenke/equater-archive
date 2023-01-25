//
//  NSDecimalNumber.swift
//  Equater
//
//  Created by Robert B. Menke on 6/13/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation

/// Taken from https://gist.github.com/mattt/1ed12090d7c89f36fd28

// MARK: - Comparable

extension NSDecimalNumber: Comparable {}

extension NSDecimalNumber {
	static func currency(decimal: Decimal) -> String? {
		let formatter = NumberFormatter()
		formatter.maximumFractionDigits = 2
		formatter.numberStyle = .decimal
		formatter.groupingSeparator = ","
		formatter.roundingMode = .down

		return formatter.string(from: decimal as NSDecimalNumber)
	}

	static func currencyDisplay(decimal: Decimal) -> String? {
		let formatter = NumberFormatter()
		formatter.maximumFractionDigits = 2
		formatter.minimumFractionDigits = 2
		formatter.numberStyle = .currency
		formatter.groupingSeparator = ","
		formatter.roundingMode = .down

		return formatter.string(from: decimal as NSDecimalNumber)
	}

	static func currency(fromInt int: Int) -> String? {
		let currency = Decimal(int) / 100

		return NSDecimalNumber.currencyDisplay(decimal: currency)
	}

	static func wholeNumberPercentage(string: String) -> NSDecimalNumber? {
		let formatter = NumberFormatter()
		formatter.maximumFractionDigits = 0
		formatter.maximumIntegerDigits = 100
		formatter.minimumIntegerDigits = 0
		formatter.generatesDecimalNumbers = true

		let handler = NSDecimalNumberHandler(roundingMode: .down, scale: 0, raiseOnExactness: false, raiseOnOverflow: false, raiseOnUnderflow: false, raiseOnDivideByZero: false)

		if let number = formatter.number(from: string) as? NSDecimalNumber {
			return number.rounding(accordingToBehavior: handler)
		}

		return nil
	}
}

public func == (lhs: NSDecimalNumber, rhs: NSDecimalNumber) -> Bool {
	lhs.compare(rhs) == .orderedSame
}

public func < (lhs: NSDecimalNumber, rhs: NSDecimalNumber) -> Bool {
	lhs.compare(rhs) == .orderedAscending
}

// MARK: - Arithmetic Operators

public prefix func - (value: NSDecimalNumber) -> NSDecimalNumber {
	value.multiplying(by: NSDecimalNumber(mantissa: 1, exponent: 0, isNegative: true))
}

public func + (lhs: NSDecimalNumber, rhs: NSDecimalNumber) -> NSDecimalNumber {
	lhs.adding(rhs)
}

public func - (lhs: NSDecimalNumber, rhs: NSDecimalNumber) -> NSDecimalNumber {
	lhs.subtracting(rhs)
}

public func * (lhs: NSDecimalNumber, rhs: NSDecimalNumber) -> NSDecimalNumber {
	lhs.multiplying(by: rhs)
}

public func / (lhs: NSDecimalNumber, rhs: NSDecimalNumber) -> NSDecimalNumber {
	lhs.dividing(by: rhs)
}

public func ^ (lhs: NSDecimalNumber, rhs: Int) -> NSDecimalNumber {
	lhs.raising(toPower: rhs)
}
