//
//  AuthenticationDtos.swift
//  Equater
//
//  Created by Robert B. Menke on 9/8/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Foundation

// MARK: - Encodable

struct AuthenticationDto: Encodable {
	let email: String
	let password: String
}

struct ResetPasswordDto: Codable {
	let email: String
}

struct EmailDto: Codable {
	let email: String
}

struct UpdatePlaidTokenDto: Encodable {
	let token: String
}

// MARK: - Decodable

struct SignInResponse: Decodable {
	let authToken: String
	let user: User
	let userAccounts: [UserAccount]
}

struct User: Codable, Hashable, Identifiable {
	let id: UInt
	let uuid: String
	let email: String
	let emailIsConfirmed: Bool
	let firstName: String
	let lastName: String
	let canReceiveFunds: Bool
	let profilePhotoUrl: String?
	let profilePhotoUploadCompleted: Bool
	let profilePhotoSha256Hash: String?
	let coverPhotoUploadCompleted: Bool
	let coverPhotoSha256Hash: String?
	let dateTimeCreated: String
	let addressOne: String?
	let addressTwo: String?
	let city: String?
	let state: String?
	let postalCode: String?
	var preSignedPhotoDownloadUrl: String?
	var preSignedCoverPhotoDownloadUrl: String?
	var acceptedTermsOfService = false
	var acceptedPrivacyPolicy = false
	// No longer needed. No fees. Keeping in case this changes.
	var disclosureOfFeesResponse: DisclosureOfFeesResponse = .hasNotSeenPrompt
	var linkTokens: [PlaidLinkToken] = []
	var dwollaReverificationNeeded = false

	func getAddress() -> Address? {
		guard
			let addressOne = addressOne,
			let city = city,
			let state = state,
			let postalCode = postalCode
		else {
			return nil
		}

		return Address(
			addressOne: addressOne,
			addressTwo: addressTwo,
			city: city,
			state: state,
			postalCode: postalCode
		)
	}

	func getDepositoryToken() -> String? {
		guard let token = linkTokens.first(where: { $0.tokenType == .depositoryOnly }) else { return nil }

		return token.plaidLinkToken
	}

	func getCreditAndDepositoryToken() -> String? {
		guard let token = linkTokens.first(where: { $0.tokenType == .creditAndDepository }) else { return nil }

		return token.plaidLinkToken
	}

	func getProfilePhoto() -> Photo? {
		guard profilePhotoUploadCompleted, profilePhotoSha256Hash != nil else { return nil }

		return .avatar(user: self)
	}

	func getCoverPhoto() -> Photo? {
		guard coverPhotoUploadCompleted, coverPhotoSha256Hash != nil else { return nil }

		return .coverPhoto(user: self)
	}
}

struct UserAccount: Codable, Hashable, Identifiable {
	let id: UInt
	let userId: UInt
	let accountId: String
	let accountName: String
	let accountSubType: String
	let accountType: String
	let institutionId: String
	let institutionName: String
	let isActive: Bool
	let hasRemovedFundingSource: Bool
	let dwollaFundingSourceId: String?
	/// ISO8601 String
	let dateOfLastPlaidTransactionPull: String?
	var requiresPlaidReAuthentication: Bool
	var institution: Institution
	var linkTokens: [PlaidLinkToken] = []

	func getItemUpdateToken() -> PlaidLinkToken? {
		linkTokens.first { $0.tokenType == .itemUpdate }
	}
}

extension UserAccount {
	/// From the plaid docs: https://plaid.com/docs/link/duplicate-items/
	/// You can compare a combination of the accounts’
	/// institution_id, account name, and account mask to determine whether
	/// your user has previously linked their account to your application.
	func matches(_ response: PlaidLinkJson) -> Bool {
		institutionId == response.metaData.institution.institutionId
			&& accountName == response.metaData.account.name
			&& accountType == response.metaData.account.type
			&& accountSubType == response.metaData.account.subtype
	}
}

struct Institution: Codable, Hashable, Identifiable {
	let id: UInt
	let uuid: String
	let institutionId: String
	let name: String
	let websiteUrl: String
	let primaryColorHexCode: String
	let logoUrl: String?
	let logoSha256Hash: String?
}

struct EnvironmentDetails: Codable, Equatable {
	let serverEnvironment: String
	let plaidEnvironment: String
}

enum DisclosureOfFeesResponse: UInt, Codable, Equatable {
	case hasNotSeenPrompt = 0
	case didNotAgreeToFees = 1
	case agreedToFees = 2
}

struct DisclosureOfFeesDto: Codable {
	let response: DisclosureOfFeesResponse
}

struct PatchLegalDocsDto: Codable {
	let acceptedTermsOfService: Bool
	let acceptedPrivacyPolicy: Bool
}

struct Balance: Codable, Hashable {
	let dineroValueRepresentation: Int
	let id: String
	let status: String
	let type: String
	let bankAccountType: String?
	let name: String
	let created: String
	let removed: Bool
	let channels: [String]
	let bankName: String?
	let fingerprint: String?
}

enum PlaidTokenType: String, Codable {
	case depositoryOnly = "DEPOSITORY_ONLY"
	case creditAndDepository = "CREDIT_AND_DEPOSITORY"
	case androidDepositoryOnly = "ANDROID_DEPOSITORY_ONLY"
	case androidCreditAndDepository = "ANDROID_CREDIT_AND_DEPOSITORY"
	case itemUpdate = "ITEM_UPDATE"
	case androidItemUpdate = "ANDROID_ITEM_UPDATE"
}

struct PlaidLinkToken: Codable, Hashable, Identifiable {
	let id: UInt
	let userId: UInt
	let userAccountId: UInt?
	let tokenType: PlaidTokenType
	let plaidLinkToken: String
	/// ISO8601 String
	let dateTimeTokenCreated: String
	/// ISO8601 String
	let dateTimeTokenExpires: String
}
