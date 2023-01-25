//
//  GooglePlacesVendorCard.swift
//  Equater
//
//  Created by Robert B. Menke on 7/5/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import GooglePlaces
import Resolver
import SwiftUI

struct GooglePlacesVendorCard: View {
	@InjectedObject var viewModel: VendorViewModel

	let vendor: GMSAutocompletePrediction
	var onSelected: (Vendor) -> Void

	@State var isLoading = false

	var body: some View {
		Card {
			if isLoading {
				AvatarLoader(size: .custom(width: 54, height: 54))
			} else {
				MapPinAvatar(image: AppImage.mapPin.uiImage, size: .custom(width: 54, height: 54))
			}

			VStack(alignment: .leading) {
				AppText(vendor.attributedPrimaryText.string, font: .primaryText)

				if let secondaryText = vendor.attributedSecondaryText?.string {
					AppText(secondaryText, font: .subText)
						.font(.system(size: 12))
						.lineLimit(1)
				}
			}
			.padding(.leading, 12)
		}
		.onTapGesture {
			if isLoading {
				return
			}

			isLoading = true
			viewModel.createVendor(fromPlaceResult: vendor) { vendor in
				self.isLoading = false
				self.onSelected(vendor)
			}
		}
	}
}

private struct MapPinAvatar: View {
	var image: UIImage
	var size: AvatarSize = .defaultSize
	var onTap: (() -> Void)?

	var body: some View {
		Image(uiImage: image)
			.resizable()
			.aspectRatio(contentMode: .fit)
			.frame(maxWidth: 30, alignment: .center)
			.background(CircleBackground().frame(width: size.width, height: size.height, alignment: .center))
			.onTapGesture {
				self.onTap?()
			}
	}
}

private struct AvatarLoader: View {
	var size: AvatarSize = .defaultSize

	var body: some View {
		ActivityIndicator(isAnimating: .constant(true), style: .medium)
			.background(CircleBackground().frame(width: size.width, height: size.height, alignment: .center))
			.padding([.leading, .trailing], 4)
	}
}
