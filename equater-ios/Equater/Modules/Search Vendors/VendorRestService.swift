//
//  VendorSearchRestService.swift
//  Equater
//
//  Created by Robert B. Menke on 3/27/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation
import GooglePlaces
import Resolver

protocol VendorApi {
	func search(_ dto: VendorSearchRequest) -> AnyPublisher<HttpResponse<VendorSearchResponse>, AppError>

	func getPopularVendors(_ dto: FetchPopularVendorsRequest) -> AnyPublisher<HttpResponse<VendorSearchResponse>, AppError>

	func createVendor(fromGooglePlace dto: GooglePlacesPredictionItem) -> AnyPublisher<HttpResponse<Vendor>, AppError>
}

struct VendorRestService: VendorApi {
	func search(_ dto: VendorSearchRequest) -> AnyPublisher<HttpResponse<VendorSearchResponse>, AppError> {
		let request = HttpRequest<VendorSearchRequest, VendorSearchResponse>()

		return request.get(apiEndpoint: .searchVendors, requestDto: dto)
	}

	func getPopularVendors(_ dto: FetchPopularVendorsRequest) -> AnyPublisher<HttpResponse<VendorSearchResponse>, AppError> {
		let request = HttpRequest<FetchPopularVendorsRequest, VendorSearchResponse>()

		return request.get(apiEndpoint: .fetchPopularVendors, requestDto: dto)
	}

	func createVendor(fromGooglePlace dto: GooglePlacesPredictionItem) -> AnyPublisher<HttpResponse<Vendor>, AppError> {
		let request = HttpRequest<GooglePlacesPredictionItem, Vendor>()

		return request.put(apiEndpoint: .createVendorFromGooglePlace, requestDto: dto)
	}
}
