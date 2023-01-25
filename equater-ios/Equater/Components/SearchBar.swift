//
//  SearchBar.swift
//  Equater
//
//  Created by Robert B. Menke on 1/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation
import SwiftUI

/// Modified from: https://gist.github.com/jstheoriginal/ebf298b33cdb4a88c3ac5f17f058aa1f#file-searchbar-swift-L1
struct SearchBar: View {
	var placeholder: String
	@Binding var searchText: String

	var body: some View {
		HStack {
			Image(systemName: "magnifyingglass").foregroundColor(.secondary)
			PlainTextField(textValue: self.$searchText, placeholder: self.placeholder, isFirstResponder: true)
				.frameFillWidth(height: 40.0)

			Button(action: {
				self.searchText = ""
			}) {
				Image(systemName: "xmark.circle.fill")
					.foregroundColor(.secondary)
					.opacity(searchText == "" ? Double(0) : Double(1))
			}
		}
		.padding(.horizontal)
		.padding(EdgeInsets(top: 5, leading: 20, bottom: 5, trailing: 20))
		.foregroundColor(.secondary)
		.background(AppColor.backgroundSecondary.color)
		.cornerRadius(8.0)
	}
}

struct SearchBar_Previews: PreviewProvider {
	static var previews: some View {
		SearchBar(placeholder: "Search", searchText: .constant(""))
	}
}
