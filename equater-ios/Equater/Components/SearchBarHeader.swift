//
//  SearchBarHeader.swift
//  Equater
//
//  Created by Robert B. Menke on 1/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct SearchBarHeader<SelectionItem>: View {
	var title: String
	var searchInputPlaceholder: String
	@Binding var searchText: String
	@Binding var isLoading: Bool
	var selection: [SelectionItem]
	var onSelectionCompleted: ([SelectionItem]) -> Void

	var body: some View {
		VStack {
			HStack {
				AppText(self.title, font: .title)
					.padding(EdgeInsets(top: 0, leading: 5, bottom: 0, trailing: 0))

				Spacer()

				ActivityIndicator(isAnimating: self.$isLoading, style: .medium)
					.padding(EdgeInsets(top: 0.0, leading: 0.0, bottom: 0.0, trailing: 5.0))

				if !self.isLoading {
					// The material TextButton doesn't work very well here due to the padding
					Button(
						action: {
							self.onSelectionCompleted(self.selection)
						},
						label: {
							Text("Done")
						}
					)
					.foregroundColor(AppColor.accentPrimaryForText.color)
					.padding(.trailing, 5.0)
				}
			}
			.frame(
				minWidth: 0,
				maxWidth: .infinity,
				minHeight: 30,
				maxHeight: 30,
				alignment: Alignment.center
			)
			.padding(EdgeInsets(top: 0, leading: 15, bottom: 0, trailing: 15))

			HStack {
				SearchBar(
					placeholder: self.searchInputPlaceholder,
					searchText: self.$searchText
				)
			}
			.padding(.horizontal)
			.shadowSmall()
		}
	}
}

struct SearchBarHeader_Previews: PreviewProvider {
	static var previews: some View {
		SearchBarHeader<Any>(
			title: "Add Payers",
			searchInputPlaceholder: "Search",
			searchText: .constant(""),
			isLoading: .constant(true),
			selection: [],
			onSelectionCompleted: { _ in
				print("On done")
			}
		)
	}
}
