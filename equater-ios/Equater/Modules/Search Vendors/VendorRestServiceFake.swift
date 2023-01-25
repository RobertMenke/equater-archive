//
//  VendorSearchRestServiceFake.swift
//  Equater
//
//  Created by Robert B. Menke on 4/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation

class VendorRestServiceFake: RestApiFake, VendorApi {
	/// Note: This should be reset to false on the setup of every test case
	static var requestShouldFail = false

	func search(_ dto: VendorSearchRequest) -> AnyPublisher<HttpResponse<VendorSearchResponse>, AppError> {
		if VendorRestServiceFake.requestShouldFail {
			return makeFailingRequest(error: AppError.networkError("Request failed"))
		}

		return makeRequest(response: VendorSearchResponse(vendors: [vendorFake]))
	}

	func getPopularVendors(_ dto: FetchPopularVendorsRequest) -> AnyPublisher<HttpResponse<VendorSearchResponse>, AppError> {
		if VendorRestServiceFake.requestShouldFail {
			return makeFailingRequest(error: AppError.networkError("Request failed"))
		}

		return makeRequest(response: VendorSearchResponse(vendors: [vendorFake]))
	}

	func createVendor(fromGooglePlace dto: GooglePlacesPredictionItem) -> AnyPublisher<HttpResponse<Vendor>, AppError> {
		if VendorRestServiceFake.requestShouldFail {
			return makeFailingRequest(error: AppError.networkError("Request failed"))
		}

		return makeRequest(response: vendorFake)
	}
}
