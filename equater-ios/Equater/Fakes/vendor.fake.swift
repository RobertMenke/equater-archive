//
//  vendor.fake.swift
//  Equater
//
//  Created by Robert B. Menke on 3/28/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation

let vendorFake = Vendor(
	id: 1,
	uuid: UUID().uuidString,
	ppdId: nil,
	dateTimeAdded: "2020-02-16T19:57:51.411Z",
	dateTimeModified: nil,
	totalNumberOfExpenseSharingAgreements: 5,
	hasBeenReviewedInternally: true,
	vendorIdentityCannotBeDetermined: false,
	friendlyName: "Great Vendor",
	logoS3Bucket: nil,
	logoS3Key: nil,
	logoUrl: nil,
	logoUploadCompleted: false,
	logoSha256Hash: UUID().uuidString
)
