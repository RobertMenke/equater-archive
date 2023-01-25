//
//  VendorCard.swift
//  Equater
//
//  Created by Robert B. Menke on 3/28/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct VendorCard: View {
	let vendor: Vendor
	var onSelected: (Vendor) -> Void

	var body: some View {
		Card {
			RemoteAvatar(
				photo: .vendorLogo(vendor: vendor),
				makeFallbackImage: { DefaultVendorImage() },
				onTap: { self.onSelected(self.vendor) }
			)

			VStack(alignment: .leading) {
				AppText(self.vendor.friendlyName, font: .primaryText)
					.padding(.leading, 4)
			}
		}
		.onTapGesture {
			self.onSelected(self.vendor)
		}
	}
}

struct DefaultVendorImage: View {
	var size: AvatarSize = .defaultSize

	var body: some View {
		VStack(alignment: .center) {
			AppImage
				.shoppingBagIcon
				.image
				.resizable()
				.aspectRatio(contentMode: .fit)
				.frame(width: size.width / 2, height: size.height / 2, alignment: .center)
		}
		.frame(width: size.width, height: size.height, alignment: .center)
		.background(
			Circle().foregroundColor(AppColor.backgroundPrimary.color)
		)
	}
}

struct VendorCard_Previews: PreviewProvider {
	static var previews: some View {
		VendorCard(vendor: vendorFake) {
			print("Selected \($0.friendlyName)")
		}
	}
}
