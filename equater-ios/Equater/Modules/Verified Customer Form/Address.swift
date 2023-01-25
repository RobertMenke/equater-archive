//
//  Address.swift
//  Equater
//
//  Created by Robert B. Menke on 10/14/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Foundation
import GooglePlaces

struct Address: Codable, Hashable {
	let addressOne: String
	var addressTwo: String?
	let city: String
	let state: String
	let postalCode: String

	init(fromGoogleLookup result: GMSPlace) throws {
		guard let components = result.addressComponents else {
			throw AppError.illegalState("Address is invalid")
		}

		addressOne = getAddressOne(components)
		addressTwo = nil
		city = getGoogleAddressComponent(components, "locality")
		state = getGoogleAddressComponentShortName(components, "administrative_area_level_1")
		postalCode = getGoogleAddressComponent(components, "postal_code")
	}

	init(addressOne: String, addressTwo: String? = nil, city: String, state: String, postalCode: String) {
		self.addressOne = addressOne
		self.addressTwo = addressTwo
		self.city = city
		self.state = state
		self.postalCode = postalCode
	}

	func displayAddress() -> String {
		"\(addressOne), \(city), \(state), \(postalCode)"
	}
}

// MARK: - Parsing Google Places

private func getAddressOne(_ components: [GMSAddressComponent]) -> String {
	let streetNumber = getGoogleAddressComponent(components, "street_number")
	let route = getGoogleAddressComponent(components, "route")

	return "\(streetNumber) \(route)"
}

private func getGoogleAddressComponent(_ components: [GMSAddressComponent], _ needle: String) -> String {
	if let found = components.first(where: { $0.types.contains(needle) }) {
		return found.name
	}

	return ""
}

private func getGoogleAddressComponentShortName(_ components: [GMSAddressComponent], _ needle: String) -> String {
	if let found = components.first(where: { $0.types.contains(needle) }) {
		return found.shortName ?? ""
	}

	return ""
}
