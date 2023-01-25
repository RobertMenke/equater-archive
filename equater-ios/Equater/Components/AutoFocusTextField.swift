//
//  TextFieldBridge.swift
//  Equater
//
//  Created by Robert B. Menke on 9/11/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Foundation
import SwiftUI

// https://stackoverflow.com/questions/56507839/how-to-make-textfield-become-first-responder
struct AutoFocusTextField: UIViewRepresentable {
	@Binding var text: String
	var placeholder: String

	func makeUIView(context: UIViewRepresentableContext<AutoFocusTextField>) -> UITextField {
		// TODO: Constant for leading padding
		let textField = UITextField()
		textField.frame.size.height = 40
		textField.delegate = context.coordinator
		textField.placeholder = placeholder
		textField.font = UIFont.systemFont(ofSize: 24)
		textField.keyboardType = .emailAddress

		return textField
	}

	func makeCoordinator() -> AutoFocusTextField.Coordinator {
		Coordinator(text: $text)
	}

	func updateUIView(_ uiView: UITextField, context: UIViewRepresentableContext<AutoFocusTextField>) {
		uiView.text = text
		if uiView.window != nil, !uiView.isFirstResponder, !context.coordinator.didBecomeFirstResponder {
			uiView.becomeFirstResponder()
			context.coordinator.didBecomeFirstResponder = true
		}
	}

	final class Coordinator: NSObject, UITextFieldDelegate {
		@Binding var text: String
		var didBecomeFirstResponder = false

		init(text: Binding<String>) {
			_text = text
		}

		func textFieldDidChangeSelection(_ textField: UITextField) {
			text = textField.text ?? ""
		}
	}
}
