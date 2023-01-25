//
//  TextInputPreview.swift
//  Equater
//
//  Created by Robert B. Menke on 5/9/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct TextInputPreview: View {
	@State private var outlinedInputText = ""
	@State private var underlinedInputText = ""
	@State private var plainInputText = ""

	var body: some View {
		VStack(alignment: .leading, spacing: 10.0) {
			OutlinedTextField(
				textValue: self.$outlinedInputText,
				labelText: "input label",
				placeholder: "placeholder",
				helperText: "optional helper text",
				isFirstResponder: true,
				onTextChanged: { text in
					print(text)
				}
			)
			.padding(8)

			UnderlinedTextField(
				textValue: self.$underlinedInputText,
				labelText: "input label",
				placeholder: "placeholder",
				helperText: "optional helper text",
				isFirstResponder: false,
				onTextChanged: { text in
					print(text)
				}
			)
			.padding(8)

			PlainTextField(textValue: self.$plainInputText, placeholder: "Plain Input", isFirstResponder: false)
				.frameFillWidth(height: 40.0)
				.padding(20)

			AppText("Outlined text: \(outlinedInputText)", font: .primaryText).padding(8)
			AppText("Underlined text: \(underlinedInputText)", font: .primaryText).padding(8)
			AppText("Underlined text: \(plainInputText)", font: .primaryText).padding(8)
		}
	}
}

struct TextPreview_Previews: PreviewProvider {
	static var previews: some View {
		TextInputPreview()
	}
}
