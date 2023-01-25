//
//  VendorSearchView.swift
//  Equater
//
//  Created by Robert B. Menke on 3/28/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct VendorSearchView: View {
	@InjectedObject var viewModel: VendorViewModel
	var onSelectionCompleted: (Vendor?) -> Void

	var body: some View {
		Window {
			HeaderWithContentLayout(
				headerHeight: 100,
				header: SearchBarHeader<Vendor>(
					title: "Select A Merchant",
					searchInputPlaceholder: "Search",
					searchText: self.$viewModel.searchTerm,
					isLoading: self.$viewModel.requestIsLoading,
					selection: [],
					onSelectionCompleted: { selection in
						if selection.count > 0 {
							self.onSelectionCompleted(selection[0])
						} else {
							self.onSelectionCompleted(nil)
						}
					}
				),
				content: VendorList(onSelectionCompleted: self.onSelectionCompleted)
			)
			.padding(.top, 20)
		}
	}
}

struct VendorSearchView_Previews: PreviewProvider {
	static var previews: some View {
		VendorSearchView { vendor in
			if let vendor = vendor {
				print(vendor.friendlyName)
			}
		}
	}
}
