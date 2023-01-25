//
//  VendorList.swift
//  Equater
//
//  Created by Robert B. Menke on 3/28/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct VendorList: View {
	@InjectedObject var appState: AppState
	@InjectedObject var viewModel: VendorViewModel
	var onSelectionCompleted: (Vendor?) -> Void

	var body: some View {
		let vendors = self.getVendorList()

		return VerticalList(
			shouldShowNoResults: { vendors.count == 0 },
			onNoResults: { VendorSearchFallback(onVendorCreatedAndSelected: self.onSelectionCompleted) },
			content: {
				ForEach(vendors, id: \.self) { vendor in
					VendorCard(vendor: vendor) { selection in
						self.onSelectionCompleted(selection)
					}
				}
			}
		)
	}

	private func getVendorList() -> [Vendor] {
		let hasCompletedSearch = viewModel.searchTerm.count == 0
			&& viewModel.vendorSearchResults.count == 0
			&& !viewModel.hasCompletedSearch

		if hasCompletedSearch {
			return appState.popularVendors
		}

		return viewModel.vendorSearchResults
	}
}

struct VendorList_Previews: PreviewProvider {
	static var previews: some View {
		VendorList { vendor in
			if let vendor = vendor {
				print(vendor)
			}
		}
	}
}
