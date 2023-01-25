//
//  String.swift
//  Equater
//
//  Created by Robert B. Menke on 10/14/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Foundation
import Validator

private let emailValidationRule = ValidationRulePattern(
	pattern: EmailValidationPattern.standard,
	error: InputError("Invalid email address")
)

extension String {
	func removeNonDigits() -> String {
		trimmingCharacters(in: CharacterSet(charactersIn: "0123456789").inverted)
	}

	func limitedTo(numCharacters number: UInt64) -> String {
		self[0 ... 3]
	}

	func capitalizingFirstLetter() -> String {
		prefix(1).localizedUppercase + dropFirst()
	}

	func lowercasingFirstLetter() -> String {
		prefix(1).localizedLowercase + dropFirst()
	}

	subscript(_ i: Int) -> String {
		let idx1 = index(startIndex, offsetBy: i)
		let idx2 = index(idx1, offsetBy: 1)
		return String(self[idx1 ..< idx2])
	}

	subscript(r: Range<Int>) -> String {
		let start = index(startIndex, offsetBy: r.lowerBound)
		let end = index(startIndex, offsetBy: r.upperBound)
		return String(self[start ..< end])
	}

	subscript(r: CountableClosedRange<Int>) -> String {
		let startIndex = index(startIndex, offsetBy: r.lowerBound)
		let endIndex = index(startIndex, offsetBy: r.upperBound - r.lowerBound)
		return String(self[startIndex ... endIndex])
	}

	/// Very basic email regex. Real validation will come from
	/// verification of the confirmation email we send out.
	func isEmail() -> Bool {
		let result = trimmingCharacters(in: .whitespaces)
			.validate(rule: emailValidationRule)

		switch result {
		case .valid: return true
		case .invalid: return false
		}
	}

	func possessive(isPlural: Bool = false) -> String {
		guard let lastLetter = last else { return self }

		if lastLetter == "s" || isPlural {
			return "\(self)'"
		}

		return "\(self)'s"
	}
}

extension String: Identifiable {
	public var id: String { self }
}
