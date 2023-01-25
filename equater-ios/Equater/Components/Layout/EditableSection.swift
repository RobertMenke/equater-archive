//
//  EditableSection.swift
//  Equater
//
//  Created by Robert B. Menke on 6/21/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct EditableSection<Content: View>: View {
	let title: String
	let onEdit: () -> Void
	let content: () -> Content

	init(_ title: String, onEdit: @escaping () -> Void, @ViewBuilder _ content: @escaping () -> Content) {
		self.title = title
		self.onEdit = onEdit
		self.content = content
	}

	var body: some View {
		VStack {
			HStack {
				ZStack {
					HStack {
						Spacer()
						Button(
							action: {
								self.onEdit()
							},
							label: {
								Text("Edit").bold()
							}
						)
						.foregroundColor(AppColor.accentPrimaryForText.color)
					}
					.frameFillWidth(height: nil)
					.offset(y: 8)

					HStack {
						AppText(self.title, font: .title)
						Spacer()
					}
					.frameFillWidth(height: nil)
					.offset(y: 8)
				}
			}
			.frameFillWidth(height: nil)
			.offset(y: 8)

			self.content()
		}
	}
}

struct EditableSection_Previews: PreviewProvider {
	static var previews: some View {
		EditableSection("Foo", onEdit: {}) {
			Text("Hello World")
		}
	}
}
