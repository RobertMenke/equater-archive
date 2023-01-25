//
//  NameInputTextField.swift
//  Equater
//
//  Created by Robert B. Menke on 10/12/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct NameInputTextField: View {
	var title: String
	var label: String
	@Binding var text: String
	var onEditingChanged: () -> Void = {}
	var onCommit: () -> Void = {}

	var body: some View {
		FormField(label: label, input: {
			TextField(
				self.title,
				text: self.$text,
				onEditingChanged: { _ in
					self.text = self.text.trimmingCharacters(in: .whitespacesAndNewlines)
					self.onEditingChanged()
				},
				onCommit: self.onCommit
			)
			.offset(x: -20.0, y: 0.0)
			.font(.system(size: 20.0))
			.autocapitalization(.none)
			.keyboardType(.default)
			.textContentType(.givenName)
			.multilineTextAlignment(.trailing)
		})
	}
}

struct NameInputTextField_Previews: PreviewProvider {
	static var previews: some View {
		Form {
			NameInputTextField(
				title: "First Name",
				label: "First Name",
				text: .constant("")
			)
		}
	}
}
