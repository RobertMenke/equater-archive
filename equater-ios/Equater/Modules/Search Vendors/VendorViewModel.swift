//
//  VendorSearchViewModel.swift
//  Equater
//
//  Created by Robert B. Menke on 3/27/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation
import GoogleMaps
import GooglePlaces
import Resolver

class VendorViewModel: Identifiable, ObservableObject {
	@Injected private var searchApi: VendorApi

	@Published var searchTerm = ""
	@Published var vendorSearchResults: [Vendor] = []
	@Published var requestIsLoading = false
	@Published var searchError = ""
	@Published var hasCompletedSearch = false
	@Published var googlePlacesSearchResults: [GMSAutocompletePrediction] = []
	@Published var hasAttemptedGooglePlacesFallbackSearch = false

	private var disposables = Set<AnyCancellable>()

	init() {
		createSearchListener()
		$searchTerm
			.dropFirst()
			.sink(receiveValue: { _ in
				self.hasCompletedSearch = false
			})
			.store(in: &disposables)
	}

	/// When we can't find a merchant in our own database, fallback to the google places SDK
	func performGoogleSearch(searchTerm text: String) {
		let filter = GMSAutocompleteFilter()
		filter.type = .establishment
		filter.country = "US"

		let locationRequest = LocationPermissionRequest.shared

		locationRequest.requestLocation { location in
			if let userLocation = location {
				let northEast = self.locationWithBearing(bearingRadians: 45, distanceMeters: getMilesInMeters(miles: 50), origin: userLocation.coordinate)
				let southWest = self.locationWithBearing(bearingRadians: 225, distanceMeters: getMilesInMeters(miles: 50), origin: userLocation.coordinate)
				filter.locationBias = GMSPlaceRectangularLocationOption(northEast, southWest)
			}

			let placesClient = GMSPlacesClient.shared()
			placesClient.findAutocompletePredictions(fromQuery: text, filter: filter, sessionToken: nil) { predictions, _ in
				let placePredictions = predictions ?? []
				self.googlePlacesSearchResults = placePredictions
				self.hasAttemptedGooglePlacesFallbackSearch = true
			}
		}
	}

	public func createVendor(fromPlaceResult place: GMSAutocompletePrediction, callback: @escaping (Vendor) -> Void) {
		let dto = GooglePlacesPredictionItem.fromPrediction(place)
		let request = searchApi.createVendor(fromGooglePlace: dto)

		request
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { [weak self] value in
					guard self != nil else { return }
					switch value {
					case .failure(let err):
						logger.console("createMerchantSharedExpense \(err.localizedDescription)")
						DispatchQueue.global(qos: .default).asyncAfter(deadline: .now() + 1) {
							self?.createVendor(fromPlaceResult: place, callback: callback)
						}
					case .finished:
						logger.console("createMerchantSharedExpense finished")
					}
				},
				receiveValue: { response in
					if let body = response.body {
						callback(body)
					} else if let error = response.error {
						logger.console("Error: \(error)")
						DispatchQueue.global(qos: .default).asyncAfter(deadline: .now() + 1) {
							self.createVendor(fromPlaceResult: place, callback: callback)
						}
					}
				}
			)
			.store(in: &disposables)
	}

	private func createSearchListener() {
		$searchTerm
			.dropFirst()
			.removeDuplicates()
			.debounce(for: 0.5, scheduler: DispatchQueue.main)
			.map {
				self.requestIsLoading = true
				self.hasAttemptedGooglePlacesFallbackSearch = false
				return VendorSearchRequest(searchTerm: $0)
			}
			.setFailureType(to: AppError.self)
			.flatMap { self.searchApi.search($0) }
			.catch { err -> Just<HttpResponse<VendorSearchResponse>> in
				logger.error("/(err.localizedDescription)")
				return Just(HttpResponse<VendorSearchResponse>(
					status: 200,
					error: err.localizedDescription,
					body: VendorSearchResponse(
						vendors: []
					)
				))
			}
			.receive(on: DispatchQueue.main)
			.sink(receiveValue: { (response: HttpResponse<VendorSearchResponse>) in
				guard let body = response.body else { return }
				if let error = response.error {
					logger.error("\(error)")
					self.searchError = "Search error"
				}
				self.vendorSearchResults = body.vendors
				self.requestIsLoading = false
				self.hasCompletedSearch = self.searchTerm.count > 0
			})
			.store(in: &disposables)
	}

	/// Math: https://stackoverflow.com/a/26500318/4313362
	/// Bearing refers to the direction that you want to advance,
	/// in degrees, so for north: bearing = 0, for east: bearing = 90, for southwest: bearing = 225, etc...
	private func locationWithBearing(bearingRadians: Double, distanceMeters: Double, origin: CLLocationCoordinate2D) -> CLLocationCoordinate2D {
		let distRadians = distanceMeters / 6_372_797.6 // earth radius in meters

		let lat1 = origin.latitude * Double.pi / 180
		let lon1 = origin.longitude * Double.pi / 180

		let lat2 = asin(sin(lat1) * cos(distRadians) + cos(lat1) * sin(distRadians) * cos(bearingRadians))
		let lon2 = lon1 + atan2(sin(bearingRadians) * sin(distRadians) * cos(lat1), cos(distRadians) - sin(lat1) * sin(lat2))

		return CLLocationCoordinate2D(latitude: lat2 * 180 / Double.pi, longitude: lon2 * 180 / Double.pi)
	}
}
