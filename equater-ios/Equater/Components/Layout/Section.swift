//
//  Section.swift
//  Equater
//
//  Created by Robert B. Menke on 6/21/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct Section<Content: View>: View {
	let title: String
	let content: () -> Content

	init(_ title: String, @ViewBuilder _ content: @escaping () -> Content) {
		self.title = title
		self.content = content
	}

	var body: some View {
		VStack(spacing: 4) {
			HStack {
				AppText(self.title, font: .title)
				Spacer()
			}
			.frameFillWidth(height: nil)
			.padding(.leading, 1)

			self.content()
		}
		.frameFillWidth(height: nil)
	}
}

struct Section_Previews: PreviewProvider {
	static var previews: some View {
		Section("Great Section") {
			AppText("Hello world", font: .primaryText)
		}
	}
}
