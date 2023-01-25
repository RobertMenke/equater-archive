//
//  VendorSearchFallback.swift
//  Equater
//
//  Created by Robert B. Menke on 7/5/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct VendorSearchFallback: View {
	@InjectedObject var viewModel: VendorViewModel
	var onVendorCreatedAndSelected: (Vendor) -> Void

	var body: some View {
		Group {
			if !viewModel.hasCompletedSearch {
				NoSearchResults(
					searchText: self.$viewModel.searchTerm,
					hasCompletedSearch: self.$viewModel.hasCompletedSearch,
					defaultText: "Find an expense you'd like to share"
				)
			} else if viewModel.requestIsLoading {
				NoSearchResults(
					searchText: self.$viewModel.searchTerm,
					hasCompletedSearch: .constant(false),
					defaultText: "Loading..."
				)
			} else if !viewModel.hasAttemptedGooglePlacesFallbackSearch {
				GooglePlacesFallbackAction()
			} else if viewModel.googlePlacesSearchResults.count > 0 {
				VStack {
					PoweredByGoogle()
						.padding(.top, 2)
						.padding(.bottom, 6)

					ScrollView {
						VStack {
							ForEach(viewModel.googlePlacesSearchResults, id: \.self) { result in
								GooglePlacesVendorCard(vendor: result) { createdVendor in
									logger.console("Selected place \(createdVendor)")
									onVendorCreatedAndSelected(createdVendor)
								}
							}
						}
					}
				}
				.padding([.leading, .trailing], 16)
			} else {
				NoSearchResults(
					searchText: self.$viewModel.searchTerm,
					hasCompletedSearch: self.$viewModel.hasCompletedSearch,
					defaultText: "Find an expense you'd like to share"
				)
			}
		}
	}

	private func GooglePlacesFallbackAction() -> some View {
		VStack {
			AppText("Try Google Maps", font: .custom(size: 20, color: .textPrimary))
				.bold()
				.frameFillWidth(height: nil)
				.padding(.bottom, 4)

			AppText("Snap! This one isn't in our database. If we find it on Google Maps we can still split the bill. Give it a try!", font: .custom(size: 14, color: .textSecondary))
				.frameFillWidth(height: nil)
				.lineSpacing(3)

			ContainedButton(
				label: "Search Google Maps",
				enabled: true,
				size: .custom(width: .infinity, height: 50),
				isLoading: .constant(false),
				onTap: {
					if viewModel.searchTerm.trimmingCharacters(in: .whitespacesAndNewlines).count > 0 {
						viewModel.performGoogleSearch(searchTerm: viewModel.searchTerm)
					}
				}
			)
			.padding(.top, 12)
		}
		.padding([.leading, .trailing], 16)
		.padding(.top, 12)
	}
}

private struct PoweredByGoogle: View {
	var body: some View {
		HStack {
			AppImage.poweredByGoogle.image
		}
		.frameFillWidth(height: nil, alignment: .leading)
	}
}

struct VendorSearchFallback_Previews: PreviewProvider {
	static var previews: some View {
		VendorSearchFallback(onVendorCreatedAndSelected: { vendor in
			logger.console("Vendor selected \(vendor)")
		})
	}
}
