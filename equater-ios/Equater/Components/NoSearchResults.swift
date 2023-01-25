//
//  NoSearchResults.swift
//  Equater
//
//  Created by Robert B. Menke on 2/16/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct NoSearchResults: View {
	@Binding var searchText: String
	@Binding var hasCompletedSearch: Bool
	let defaultText: String

	@State private var hasSearchedOnce = false

	var body: some View {
		VStack {
			AppImage.noSearchResults.image
				.resizable()
				.aspectRatio(contentMode: .fit)
				.frameFillWidth(height: 200, alignment: .center)

			self.makeText(self.hasAttemptedSearch() ? "No results for \(self.searchText)." : self.defaultText)
		}
		.padding([.leading, .trailing], 16)
		.offset(y: -25)
	}

	private func makeText(_ text: String) -> some View {
		AppText(text, font: .primaryText)
			.multilineTextAlignment(.center)
			.lineLimit(3)
			.lineLimit(nil)
			.offset(y: -30)
	}

	private func hasAttemptedSearch() -> Bool {
		if searchText.count == 0 {
			DispatchQueue.main.async {
				self.hasSearchedOnce = false
			}

		} else if hasCompletedSearch, !hasSearchedOnce {
			DispatchQueue.main.async {
				self.hasSearchedOnce = true
			}
		}

		return searchText.count > 0 && hasSearchedOnce
	}
}

struct NoSearchResults_Previews: PreviewProvider {
	static var previews: some View {
		NoSearchResults(
			searchText: .constant(""),
			hasCompletedSearch: .constant(false),
			defaultText: "Your friends are one search away"
		)
	}
}
