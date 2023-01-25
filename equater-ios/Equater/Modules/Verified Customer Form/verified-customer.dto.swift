//
//  verified-customer.dto.swift
//  Equater
//
//  Created by Robert B. Menke on 1/23/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation

struct RecipientOfFundsFormDto: Codable {
	let address: Address
	let dateOfBirth: Date
	let lastFourOfSsn: String
}

struct PatchAddressDto: Codable {
	let address: Address
}
