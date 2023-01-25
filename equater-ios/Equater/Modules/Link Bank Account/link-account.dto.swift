//
//  PlaidLinkResponse.swift
//  Equater
//
//  Created by Robert B. Menke on 9/28/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Foundation

struct PlaidLinkJson: Codable {
	let token: String
	let metaData: PlaidMetaData
	// This is a deprecated concept that I don't have time to fully remove from the API right now
	// TODO: Remove this in an up update
	var isDefaultPaymentAccount = false
}

struct PlaidMetaData: Codable {
	let account: PlaidAccount
	let institution: PlaidInstitution
}

struct PlaidAccount: Codable {
	let id: String
	let name: String
	let subtype: String
	let type: String
	let mask: String
}

struct PlaidInstitution: Codable {
	let institutionId: String
	let name: String
}

struct PatchBankAccountResponse: Codable {
	let user: User
	let userAccounts: [UserAccount]
}

struct UserAccountIdDto: Codable {
	let accountId: UInt
}
