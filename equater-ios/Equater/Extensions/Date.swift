//
//  Date.swift
//  Equater
//
//  Created by Robert B. Menke on 2/16/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation
import SwiftDate

enum TimeIntervalHelper: TimeInterval {
	case minute = 60.0
	case hour = 360.0
	case day = 8640.0
	case year = 3_153_600.0
}

extension Date {
	func localDate() -> Date {
		let timeZoneOffset = Double(TimeZone.current.secondsFromGMT(for: self))
		guard let localDate = Calendar.current.date(byAdding: .second, value: Int(timeZoneOffset), to: self) else { return Date() }

		return localDate
	}

	static func fromIso8601(_ input: String) throws -> Date {
		let dateFormatter = DateFormatter()
		dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ"

		guard let date = dateFormatter.date(from: input) else {
			throw AppError.illegalArgument("Supplied a non ISO8601 date in Date.fromIso8601")
		}

		return date
	}

	func formatMonthYear() -> String {
		let formatter = DateFormatter()
		formatter.dateFormat = "MMMM, yyyy"

		return formatter.string(from: self)
	}

	func formatMonthDayYear() -> String {
		let numberFormatter = NumberFormatter()
		numberFormatter.numberStyle = .ordinal
		guard let day = numberFormatter.string(from: day as NSNumber) else { return "" }

		let monthFormatter = DateFormatter()
		monthFormatter.timeZone = TimeZone(abbreviation: "GMT")
		monthFormatter.dateFormat = "MMMM"

		let yearFormatter = DateFormatter()
		yearFormatter.timeZone = TimeZone(abbreviation: "GMT")
		yearFormatter.dateFormat = "yyyy"

		return "\(monthFormatter.string(from: self)) \(day), \(yearFormatter.string(from: self))"
	}

	func formatTime() -> String {
		let formatter = DateFormatter()
		formatter.dateFormat = "hh:mm a"

		return formatter.string(from: self)
	}

	func addDay(_ n: Int) -> Date {
		let cal = NSCalendar.current
		return cal.date(byAdding: .day, value: n, to: self)!
	}

	func addMonth(_ n: Int) -> Date {
		let cal = NSCalendar.current
		return cal.date(byAdding: .month, value: n, to: self)!
	}

	func addYear(_ n: Int) -> Date {
		let cal = NSCalendar.current
		return cal.date(byAdding: .year, value: n, to: self)!
	}
}

extension DateInRegion {
	func formatMonthDayYear() -> String {
		date.formatMonthDayYear()
	}

	func formatTime() -> String {
		date.formatTime()
	}

	func formatWithSlashes() -> String {
		let formatter = DateFormatter()
		formatter.dateFormat = "MM/dd/yyyy"

		return formatter.string(from: date)
	}
}
