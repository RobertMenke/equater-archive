//
//  LocationPermissionRequest.swift
//  Equater
//
//  Created by Robert B. Menke on 7/5/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import CoreLocation
import Foundation

class LocationPermissionRequest: NSObject, CLLocationManagerDelegate {
	static let shared = LocationPermissionRequest()
	private let locationManager = CLLocationManager()
	private var callback: ((CLLocation?) -> Void)?

	override private init() {
		super.init()
		locationManager.delegate = self
	}

	func requestLocation(_ callback: @escaping (CLLocation?) -> Void) {
		let status = CLLocationManager.authorizationStatus()

		if self.callback == nil {
			self.callback = callback
		}

		switch status {
		case .notDetermined:
			locationManager.requestWhenInUseAuthorization()
			return
		case .denied, .restricted:
			callback(nil)
			return
		case .authorizedAlways, .authorizedWhenInUse:
			callback(locationManager.location)
			break
		@unknown default:
			callback(nil)
		}
	}

	func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
		let status = CLLocationManager.authorizationStatus()

		guard let callback = callback else { return }

		switch status {
		case .notDetermined:
			return
		case .denied, .restricted:
			callback(nil)
			return
		case .authorizedAlways, .authorizedWhenInUse:
			callback(locationManager.location)
			break
		@unknown default:
			break
		}

		self.callback = nil
	}
}
