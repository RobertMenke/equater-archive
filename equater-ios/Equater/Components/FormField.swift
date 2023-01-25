//
//  FormField.swift
//  Equater
//
//  Created by Robert B. Menke on 10/14/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct FormField<T>: View where T: View {
	var label: String
	var input: () -> T
	var onTapGesture: () -> Void = {}

	var body: some View {
		HStack {
			Text(label)
				.font(.system(size: 18.0))
			Spacer()
			input()
		}
		.onTapGesture(perform: onTapGesture)
	}
}

struct FormField_Previews: PreviewProvider {
	static var previews: some View {
		Form {
			FormField(
				label: "Foo",
				input: {
					TextField(
						"Bar",
						text: .constant("")
					)
					.font(.system(size: 20.0))
					.autocapitalization(.none)
					.keyboardType(.default)
					.textContentType(.givenName)
					.multilineTextAlignment(.trailing)
				}
			)
			FormField(
				label: "Foo",
				input: {
					Text("Bar")
				}
			)
		}
	}
}
