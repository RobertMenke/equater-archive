//
//  AddressAutocomplete.swift
//  Equater
//
//  Created by Robert B. Menke on 10/14/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Bow
import Foundation
import GooglePlaces
import SwiftUI

struct AddressAutocomplete {
	let placesClient = GMSPlacesClient.shared()
	@Binding var isOpen: Bool
	let callback: (Either<AppError, Address>) -> Void
}

// MARK: - UIViewControllerRepresentable Implementation

extension AddressAutocomplete: UIViewControllerRepresentable {
	typealias UIViewControllerType = GMSAutocompleteViewController

	func makeCoordinator() -> AddressAutocomplete.Coordinator {
		Coordinator(self)
	}

	func makeUIViewController(context: UIViewControllerRepresentableContext<AddressAutocomplete>) -> UIViewControllerType {
		let controller = GMSAutocompleteViewController()
		controller.delegate = context.coordinator
		controller.primaryTextColor = AppColor.textPrimary.uiColor
		controller.secondaryTextColor = AppColor.textSecondary.uiColor
		controller.tableCellSeparatorColor = AppColor.textPrimary.uiColor
		controller.tableCellBackgroundColor = AppColor.backgroundPrimary.uiColor

		if let fields = createGMSPlaceFields() {
			controller.placeFields = fields
		}

		let filter = GMSAutocompleteFilter()
		filter.type = .address

		controller.autocompleteFilter = filter

		return controller
	}

	func updateUIViewController(_ uiViewController: AddressAutocomplete.UIViewControllerType, context: UIViewControllerRepresentableContext<AddressAutocomplete>) {}

	private func createGMSPlaceFields() -> GMSPlaceField? {
		GMSPlaceField(
			rawValue: UInt(GMSPlaceField.addressComponents.rawValue)
		)
	}
}

// MARK: - Coordinator Implementation

extension AddressAutocomplete {
	final class Coordinator: NSObject, GMSAutocompleteViewControllerDelegate {
		let controller: AddressAutocomplete

		init(_ controller: AddressAutocomplete) {
			self.controller = controller
		}

		func viewController(_ viewController: GMSAutocompleteViewController, didAutocompleteWith place: GMSPlace) {
			logger.console("didAutocompleteWith \(place)")
			do {
				let address = try Address(fromGoogleLookup: place)
				controller.callback(.right(address))
			} catch let err {
				logger.error("Address autocomplete error", error: err)
				self.controller.callback(.left(AppError.illegalState(err.localizedDescription)))
			}
		}

		func viewController(_ viewController: GMSAutocompleteViewController, didFailAutocompleteWithError error: Error) {
			logger.console("didFailAutocompleteWithError \(error)")
			controller.callback(.left(AppError.illegalState(error.localizedDescription)))
		}

		func wasCancelled(_ viewController: GMSAutocompleteViewController) {
			controller.isOpen = false
			logger.console("GMSAutocompleteViewControllerDelegate wasCancelled")
		}
	}
}
