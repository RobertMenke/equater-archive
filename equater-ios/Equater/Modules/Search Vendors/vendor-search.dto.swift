//
//  vendor-search.dto.swift
//  Equater
//
//  Created by Robert B. Menke on 3/27/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation
import GooglePlaces

struct VendorSearchRequest: Encodable {
	let searchTerm: String
	let requiringInternalReview = false
}

struct VendorSearchResponse: Codable {
	let vendors: [Vendor]
}

struct Vendor: Codable, Hashable, Identifiable {
	let id: Int
	let uuid: String
	let ppdId: String?
	let dateTimeAdded: String? // iso date
	let dateTimeModified: String? // iso date
	let totalNumberOfExpenseSharingAgreements: Int
	let hasBeenReviewedInternally: Bool
	let vendorIdentityCannotBeDetermined: Bool
	let friendlyName: String
	let logoS3Bucket: String?
	let logoS3Key: String?
	let logoUrl: String?
	let logoUploadCompleted: Bool
	let logoSha256Hash: String?
}

struct FetchPopularVendorsRequest: Encodable {
	let limit = 50
}

struct GooglePlacesSearchRequest: Encodable {
	let searchTerm: String
	let lat: String
	let lon: String
}

/// This is used to create a UniqueVendor on the server
struct GooglePlacesPredictionItem: Codable {
	let placeId: String
	let fullText: String
	let primaryText: String
	let secondaryText: String

	static func fromPrediction(_ prediction: GMSAutocompletePrediction) -> Self {
		GooglePlacesPredictionItem(
			placeId: prediction.placeID,
			fullText: prediction.attributedFullText.string,
			primaryText: prediction.attributedPrimaryText.string,
			secondaryText: prediction.attributedSecondaryText?.string ?? ""
		)
	}
}
