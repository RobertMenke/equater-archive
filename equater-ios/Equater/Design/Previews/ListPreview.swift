//
//  ListLayout.swift
//  Equater
//
//  Created by Robert B. Menke on 4/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct ListPreview: View {
	var body: some View {
		Window {
			HeaderWithContentLayout(
				headerHeight: 100,
				header: SearchBarHeader(
					title: "Sample Header",
					searchInputPlaceholder: "Search",
					searchText: .constant(""),
					isLoading: .constant(false),
					selection: [],
					onSelectionCompleted: { _ in
					}
				),
				content: VerticalList(
					shouldShowNoResults: { false },
					onNoResults: { AppText("No Results", font: .primaryText) },
					content: {
						Card {
							AppText("Foo", font: .primaryText)
						}

						Card {
							AppText("Bar", font: .primaryText)
						}
					}
				)
			)
		}
	}
}

struct ListLayout_Previews: PreviewProvider {
	static var previews: some View {
		ListPreview()
	}
}
