//
//  VerticalList.swift
//  Equater
//
//  Created by Robert B. Menke on 3/29/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct VerticalList<NoResults: View, Content: View, ListHeader: View>: View {
	let shouldShowNoResults: () -> Bool
	let onNoResults: () -> NoResults
	var listHeader: (() -> ListHeader)?
	let content: () -> Content

	init(
		shouldShowNoResults: @escaping () -> Bool,
		onNoResults: @escaping () -> NoResults,
		listHeader: (() -> ListHeader)? = nil,
		@ViewBuilder content: @escaping () -> Content
	) {
		self.shouldShowNoResults = shouldShowNoResults
		self.onNoResults = onNoResults
		self.listHeader = listHeader
		self.content = content
	}

	var body: some View {
		VStack {
			listHeader?()

			if shouldShowNoResults() {
				onNoResults()
			} else {
				GeometryReader { (geo: GeometryProxy) in
					ScrollView(.vertical) {
						VStack(spacing: 10) {
							self.content()
						}
						.padding(EdgeInsets(top: 10, leading: 15, bottom: 0, trailing: 15))
						.frame(width: geo.size.width)
					}
					.frame(width: geo.size.width)
				}
			}
		}
		.padding(EdgeInsets(top: 5.0, leading: 0.0, bottom: 0, trailing: 0.0))
	}
}

extension VerticalList where ListHeader == AnyView {
	init(
		shouldShowNoResults: @escaping () -> Bool,
		onNoResults: @escaping () -> NoResults,
		@ViewBuilder content: @escaping () -> Content
	) {
		self.init(
			shouldShowNoResults: shouldShowNoResults,
			onNoResults: onNoResults,
			listHeader: nil,
			content: content
		)
	}
}

struct VerticalList_Previews: PreviewProvider {
	static var previews: some View {
		VerticalList(
			shouldShowNoResults: { false },
			onNoResults: { Text("No Results") },
			content: {
				ForEach([userFake], id: \.self) {
					UserCard(user: $0) { user in
						print("Selected: \(user.firstName)")
					}
				}
			}
		)
	}
}
