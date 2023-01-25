//
//  user.fake.swift
//  Equater
//
//  Created by Robert B. Menke on 1/31/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation

let userFake = User(
	id: 1,
	uuid: "stub",
	email: "fake@gmail.com",
	emailIsConfirmed: true,
	firstName: "Jane",
	lastName: "Doe",
	canReceiveFunds: true,
	profilePhotoUrl: "fake",
	profilePhotoUploadCompleted: false,
	profilePhotoSha256Hash: UUID().uuidString,
	coverPhotoUploadCompleted: false,
	coverPhotoSha256Hash: UUID().uuidString,
	dateTimeCreated: "2020-02-16T19:57:51.411Z",
	addressOne: nil,
	addressTwo: nil,
	city: nil,
	state: nil,
	postalCode: nil,
	preSignedPhotoDownloadUrl: nil,
	preSignedCoverPhotoDownloadUrl: nil,
	linkTokens: [],
	dwollaReverificationNeeded: false
)

let institution = Institution(
	id: 1,
	uuid: UUID().uuidString,
	institutionId: "ins_1234",
	name: "Equater Bank",
	websiteUrl: "https://equater.app",
	primaryColorHexCode: "#7A04EB",
	logoUrl: "https://equater.app",
	logoSha256Hash: UUID().uuidString
)

let userAccountFake = UserAccount(
	id: 1,
	userId: 1,
	accountId: "stub",
	accountName: "stub",
	accountSubType: "stub",
	accountType: "stub",
	institutionId: "stub",
	institutionName: "stub",
	isActive: true,
	hasRemovedFundingSource: false,
	dwollaFundingSourceId: "stub",
	dateOfLastPlaidTransactionPull: "2020-02-16T19:57:51.411Z",
	requiresPlaidReAuthentication: false,
	institution: institution,
	linkTokens: []
)
