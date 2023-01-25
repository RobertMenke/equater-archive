//
//  SocialSecurityNumberInput.swift
//  Equater
//
//  Created by Robert B. Menke on 10/14/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct SocialSecurityNumberInput: View {
	@Binding var value: String

	var body: some View {
		FormField(label: "Last 4 of SSN", input: {
			SecureField("4 digits", text: self.$value, onCommit: {
				UIApplication.shared.endEditing()
			})
			.multilineTextAlignment(.trailing)
			.keyboardType(.numbersAndPunctuation)
		})
	}
}

struct SocialSecurityNumberInput_Previews: PreviewProvider {
	static var previews: some View {
		Form {
			SocialSecurityNumberInput(value: .constant(""))
		}
	}
}
