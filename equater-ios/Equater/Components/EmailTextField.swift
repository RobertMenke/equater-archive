//
//  AuthTextField.swift
//  Equater
//
//  Created by Robert B. Menke on 9/7/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import SwiftUI

// If SwiftUI doesn't add a modifier for first responder
// use this back-up solution
// https://stackoverflow.com/questions/56507839/how-to-make-textfield-become-first-responder
struct EmailTextField: View {
	@Binding var text: String
	var placeholder: String
	var isFirstResponder: Bool
	var font: AppFont = .primaryText
	var styleTextField: ((UITextField) -> Void)?
	var onReturn: ((UITextField) -> Void)?

	var body: some View {
		PlainTextField(
			textValue: $text,
			placeholder: placeholder,
			isFirstResponder: isFirstResponder,
			styleTextField: { textField in
				textField.font = self.font.getUIFont()
				textField.keyboardType = .emailAddress
				textField.textContentType = .username
				textField.autocapitalizationType = .none
				textField.returnKeyType = .next
				let spacerView = UIView(frame: CGRect(x: 0, y: 0, width: 10, height: 10))
				textField.leftViewMode = .always
				textField.leftView = spacerView
				textField.rightViewMode = .always
				textField.rightView = spacerView
				textField.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
				styleTextField?(textField)
			},
			onReturn: onReturn
		)
		.background(AppColor.backgroundSecondary.color)
		.cornerRadius(8)
		.frameFillWidth(height: 60, alignment: .leading)
	}
}

struct AuthTextField_Previews: PreviewProvider {
	static var previews: some View {
		VStack {
			EmailTextField(text: .constant(""), placeholder: "Your email address", isFirstResponder: true)
				.frameFillWidth(height: 60.0)
		}
	}
}
