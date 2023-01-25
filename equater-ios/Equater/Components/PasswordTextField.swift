//
//  PasswordTextField.swift
//  Equater
//
//  Created by Robert B. Menke on 12/29/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct PasswordTextField: View {
	@Binding var text: String
	var placeholder: String
	var isFirstResponder: Bool
	var font: AppFont = .primaryText
	var styleTextField: ((UITextField) -> Void)?
	var onReturn: ((UITextField) -> Void)?
	var isNewPassword = false

	var body: some View {
		PlainTextField(
			textValue: $text,
			placeholder: placeholder,
			isSecureEntry: true,
			isFirstResponder: isFirstResponder,
			styleTextField: { textField in
				textField.font = self.font.getUIFont()
				textField.keyboardType = .default
				textField.textContentType = isNewPassword ? .newPassword : .password
				textField.autocapitalizationType = .none
				textField.returnKeyType = .go
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

struct PasswordTextField_Previews: PreviewProvider {
	static var previews: some View {
		PasswordTextField(text: .constant(""), placeholder: "Enter your password", isFirstResponder: true)
			.frameFillWidth(height: 60.0)
	}
}
