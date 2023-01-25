//
//  NoUserSearchResults.swift
//  Equater
//
//  Created by Robert B. Menke on 5/30/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct NoUserSearchResults: View {
	@InjectedObject private var viewModel: UserSearchViewModel
	@Binding var searchText: String
	@Binding var hasCompletedSearch: Bool
	let defaultText: String
	var onEmailSelection: (String) -> Void

	@State private var hasSearchedOnce = false

	var body: some View {
		VStack {
			// if a selection exists, don't show the image. We need all the screen real estate we can get.
			if self.viewModel.selection.count == 0 {
				AppImage.noSearchResults.image
					.resizable()
					.aspectRatio(contentMode: .fit)
					.frameFillWidth(height: 200, alignment: .center)
			}

			// If an email is entered and no results are found, allow the user to send out an invite.
			if self.searchText.isEmail() {
				self.makeText("We didn't find \(self.searchText). Tap the button below to invite them!")

				ContainedButton(
					label: "Add By Email",
					enabled: true,
					size: .custom(width: .infinity, height: 50),
					isLoading: .constant(false),
					onTap: {
						self.onEmailSelection(self.searchText.trimmingCharacters(in: .whitespaces))
					}
				)
				.offset(y: self.viewModel.selection.count == 0 ? -30 : 0)
			} else {
				self.makeText(self.hasAttemptedSearch() ? "No results for \(self.searchText). Enter their email to invite them!" : self.defaultText)
			}
		}
		.padding([.leading, .trailing], 16)
	}

	private func makeText(_ text: String) -> some View {
		AppText(text, font: .primaryText)
			.multilineTextAlignment(.center)
			.lineLimit(3)
			.lineLimit(nil)
			.offset(y: viewModel.selection.count == 0 ? -30 : 0)
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
