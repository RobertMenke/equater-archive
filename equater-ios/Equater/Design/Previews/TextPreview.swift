//
//  TextPreview.swift
//  Equater
//
//  Created by Robert B. Menke on 5/9/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct TextInputPreview: View {
	@State private var outlineFocused = false
	@State private var underlineFocused = false

	var body: some View {
		VStack(alignment: .leading, spacing: 10.0) {
			OutlinedTextField(
				textValue: .constant(""),
				labelText: .constant("input label"),
				placeholder: .constant("placeholder"),
				helperText: .constant("optional helper text"),
				isFirstResponder: $outlineFocused,
				onTextChanged: { text in
					print(text)
				}
			)
			.padding(8)

			UnderlinedTextField(
				textValue: .constant(""),
				labelText: .constant("input label"),
				placeholder: .constant("placeholder"),
				helperText: .constant("optional helper text"),
				isFirstResponder: $underlineFocused,
				onTextChanged: { text in
					print(text)
				}
			)
			.padding(8)
		}
		.frameFillParent()
		.background(Color.blue)
		.onTapGesture {
			self.outlineFocused = false
			self.underlineFocused = false
		}
	}
}

struct TextPreview_Previews: PreviewProvider {
	static var previews: some View {
		TextInputPreview()
	}
}
