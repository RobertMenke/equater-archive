//
//  AppTextField.swift
//  Equater
//
//  Created by Robert B. Menke on 4/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import MaterialComponents.MaterialTextControls_OutlinedTextFields
import SwiftUI

enum TextFieldStyle {
	case outlined
	case underlined
}

struct OutlinedTextField: View {
	@Binding var textValue: String
	var labelText: String
	var placeholder: String
	var helperText: String?
	var isFirstResponder: Bool
	var styleTextField: ((MDCBaseTextField) -> Void)?
	var onTextChanged: ((String) -> Void)?
	var onFocusBegan: ((UITextField) -> Void)?
	var onReturnKeyTapped: ((UITextField) -> Void)?
	var isEnabled = true

	var body: some View {
		MaterialTextField(
			textValue: $textValue,
			labelText: labelText,
			placeholder: placeholder,
			helperText: helperText,
			isFirstResponder: isFirstResponder,
			textFieldStyle: .outlined,
			styleTextField: styleTextField,
			onTextChanged: onTextChanged,
			onFocusBegan: onFocusBegan,
			onReturnKeyTapped: onReturnKeyTapped,
			isEnabled: isEnabled
		)
		.frame(height: 100.0)
	}
}

struct UnderlinedTextField: View {
	@Binding var textValue: String
	var labelText: String
	var placeholder: String
	var helperText: String?
	var isFirstResponder: Bool
	var styleTextField: ((MDCBaseTextField) -> Void)?
	var onTextChanged: ((String) -> Void)?
	var onFocusBegan: ((UITextField) -> Void)?
	var onReturnKeyTapped: ((UITextField) -> Void)?
	var isEnabled = true

	var body: some View {
		MaterialTextField(
			textValue: $textValue,
			labelText: labelText,
			placeholder: placeholder,
			helperText: helperText,
			isFirstResponder: isFirstResponder,
			textFieldStyle: .underlined,
			styleTextField: styleTextField,
			onTextChanged: onTextChanged,
			onFocusBegan: onFocusBegan,
			onReturnKeyTapped: onReturnKeyTapped,
			isEnabled: isEnabled
		)
		.frame(height: 100.0)
	}
}

struct PlainTextField: View {
	@Binding var textValue: String
	var placeholder: String
	var isSecureEntry = false
	var isFirstResponder: Bool
	var styleTextField: ((UITextField) -> Void)?
	var onTextChanged: ((String) -> Void)?
	var onFocusBegan: ((UITextField) -> Void)?
	var onReturn: ((UITextField) -> Void)?

	var body: some View {
		TextFieldWrapper(
			textValue: $textValue,
			placeholder: placeholder,
			isSecureEntry: isSecureEntry,
			isFirstResponder: isFirstResponder,
			styleTextField: styleTextField,
			onTextChanged: onTextChanged,
			onFocusBegan: onFocusBegan,
			onReturn: onReturn
		)
	}
}

private typealias TextFieldContext = UIViewRepresentableContext<MaterialTextField>

/// Dealing with text fields as UIViewRepresentable is a bit tricky for a few reasons,
/// namely that most state updates need to be applied via UITextFieldDelegate. I'm tempted
/// to look into some kind of SwiftUI -> UIKit trigger that calls textField.layoutIfNeeded()
/// as state changes, but for now I believe this implementation suits the needs of the project
/// even though there are certain quirks like the responder chain only being programmatically
/// set on the initial render
private struct MaterialTextField: UIViewRepresentable {
	/// The value of the input
	@Binding var textValue: String

	/// Floating label that provides context even while the input is filled
	var labelText: String

	/// The faint text that appears in the input when nothing has been typed
	var placeholder: String

	/// Displayed on the bottom of the text field and is used for extra explanation
	var helperText: String?

	/// Determines whether the text is shown or not
	var isSecureEntry = false

	/// Note that it's only possible to become first responder programmatically when
	/// the view gets created. UIViewRepresentable will not respect state changes
	/// in SwiftUI land and managing the responder chain must be done in UIKit
	@State var isFirstResponder: Bool

	/// Determines the MDC text field style requested
	var textFieldStyle: TextFieldStyle

	/// Optionally, provide custom styling for the text field imperatively
	var styleTextField: ((MDCBaseTextField) -> Void)?

	/// Handler for $textValue being changed
	var onTextChanged: ((String) -> Void)?

	/// Hooks into didBeginEditing
	var onFocusBegan: ((UITextField) -> Void)?

	/// Hooks into textFieldShouldReturn
	var onReturnKeyTapped: ((UITextField) -> Void)?

	@State var isEnabled = true

	func makeUIView(context: TextFieldContext) -> MDCBaseTextField {
		let estimatedFrame = CGRect.zero
		let textField = textFieldStyle == .outlined
			? MDCOutlinedTextField(frame: estimatedFrame)
			: MDCFilledTextField(frame: estimatedFrame)
		textField.label.text = labelText
		textField.text = textValue
		textField.placeholder = placeholder
		textField.leadingAssistiveLabel.text = helperText
		textField.isSecureTextEntry = isSecureEntry
		let textColor = AppColor.textPrimary.uiColor

		if let field = textField as? MDCOutlinedTextField {
			field.applyTheme(withScheme: globalMaterialTheme)
			field.setOutlineColor(textColor, for: .normal)
		}

		if let field = textField as? MDCFilledTextField {
			field.applyTheme(withScheme: globalMaterialTheme)
			field.setFilledBackgroundColor(.clear, for: .editing)
			field.setFilledBackgroundColor(.clear, for: .normal)
			field.setUnderlineColor(textColor, for: .normal)
		}

		textField.setFloatingLabelColor(textColor, for: .normal)
		textField.setNormalLabelColor(textColor, for: .normal)
		textField.setTextColor(textColor, for: .editing)
		textField.setTextColor(textColor, for: .normal)
		textField.setLeadingAssistiveLabelColor(textColor, for: .normal)
		textField.setLeadingAssistiveLabelColor(textColor, for: .editing)

		textField.sizeToFit()
		textField.delegate = context.coordinator
		styleTextField?(textField)

		return textField
	}

	func updateUIView(_ uiView: MDCBaseTextField, context: TextFieldContext) {
		// There's a bug in the SwiftUI NavigationView where updateUIView never gets called. In order to make something a first
		// responder while the window is nil we'll need to resort to polling the view
		if uiView.window == nil, isFirstResponder {
			eventuallyBecomeFirstResponder(uiView)
		} else if shouldBecomeFirstResponder(uiView) {
			becomeFirstResponder(uiView)
		}

		uiView.text = textValue
	}

	/// Checks back every 0.5 seconds to see if the window is no longer nil. There's nothing particularly
	/// scientific about 0.5 seconds, it's just a value that didn't cause UI jank
	private func eventuallyBecomeFirstResponder(_ textField: MDCBaseTextField) {
		DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
			if self.shouldBecomeFirstResponder(textField) {
				self.becomeFirstResponder(textField)
			} else {
				self.eventuallyBecomeFirstResponder(textField)
			}
		}
	}

	private func becomeFirstResponder(_ textField: MDCBaseTextField) {
		textField.becomeFirstResponder()
		// Avoid becoming the first responder any time a re-render happens
		DispatchQueue.main.async {
			self.isFirstResponder = false
		}
	}

	private func shouldBecomeFirstResponder(_ textField: MDCBaseTextField) -> Bool {
		textField.window != nil && isFirstResponder && !textField.isFirstResponder
	}

	func makeCoordinator() -> Coordinator {
		Coordinator(self)
	}

	final class Coordinator: NSObject, UITextFieldDelegate {
		var textField: MaterialTextField

		init(_ textField: MaterialTextField) {
			self.textField = textField
		}

		/// Note that isFirstResponder state is being kept in sync in order to handle updateUiView properly
		func textFieldShouldReturn(_ textField: UITextField) -> Bool {
			textField.resignFirstResponder()
			self.textField.isFirstResponder = false
			self.textField.onReturnKeyTapped?(textField)

			return true
		}

		func textFieldShouldBeginEditing(_ textField: UITextField) -> Bool {
			self.textField.isEnabled
		}

		func textFieldDidBeginEditing(_ textField: UITextField) {
			self.textField.onFocusBegan?(textField)
		}

		func textFieldDidEndEditing(_ textField: UITextField) {
			self.textField.isFirstResponder = false
		}

		func textFieldDidChangeSelection(_ textField: UITextField) {
			if let text = textField.text {
				self.textField.textValue = text
				self.textField.onTextChanged?(text)
			}
		}
	}
}

private struct TextFieldWrapper: UIViewRepresentable {
	/// The value of the input
	@Binding var textValue: String

	/// The faint text that appears in the input when nothing has been typed
	var placeholder: String

	/// Determines whether the text is shown or not
	var isSecureEntry = false

	/// Note that it's only possible to become first responder programmatically when
	/// the view gets created. UIViewRepresentable will not respect state changes
	/// in SwiftUI land and managing the responder chain must be done in UIKit
	@State var isFirstResponder: Bool

	/// Provide a custom text field style if desired
	var styleTextField: ((UITextField) -> Void)?

	/// Handler for $textValue being changed
	var onTextChanged: ((String) -> Void)?

	/// Hooks into didBeginEditing
	var onFocusBegan: ((UITextField) -> Void)?

	/// Handle the return key or "Go" key
	var onReturn: ((UITextField) -> Void)?

	func makeUIView(context: UIViewRepresentableContext<TextFieldWrapper>) -> UITextField {
		let textField = UITextField(frame: .zero)
		textField.placeholder = placeholder
		textField.font = AppFont.primaryText.getUIFont()
		textField.text = textValue
		textField.isSecureTextEntry = isSecureEntry
		textField.delegate = context.coordinator

		styleTextField?(textField)

		return textField
	}

	func updateUIView(_ uiView: UITextField, context: UIViewRepresentableContext<TextFieldWrapper>) {
		// There's a bug in the SwiftUI NavigationView where updateUIView never gets called. In order to make something a first
		// responder while the window is nil we'll need to resort to polling the view
		if uiView.window == nil, isFirstResponder {
			eventuallyBecomeFirstResponder(uiView)
		} else if shouldBecomeFirstResponder(uiView) {
			becomeFirstResponder(uiView)
		}

		uiView.text = textValue
	}

	/// Checks back every 0.5 seconds to see if the window is no longer nil. There's nothing particularly
	/// scientific about 0.5 seconds, it's just a value that didn't cause UI jank
	private func eventuallyBecomeFirstResponder(_ textField: UITextField) {
		DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
			if self.shouldBecomeFirstResponder(textField) {
				self.becomeFirstResponder(textField)
			} else {
				self.eventuallyBecomeFirstResponder(textField)
			}
		}
	}

	private func becomeFirstResponder(_ textField: UITextField) {
		textField.becomeFirstResponder()
		// Avoid becoming the first responder any time a re-render happens
		DispatchQueue.main.async {
			self.isFirstResponder = false
		}
	}

	private func shouldBecomeFirstResponder(_ textField: UITextField) -> Bool {
		textField.window != nil && isFirstResponder && !textField.isFirstResponder
	}

	func makeCoordinator() -> Coordinator {
		Coordinator(self)
	}

	final class Coordinator: NSObject, UITextFieldDelegate {
		var textField: TextFieldWrapper

		init(_ textField: TextFieldWrapper) {
			self.textField = textField
		}

		/// Note that isFirstResponder state is being kept in sync in order to handle updateUiView properly
		func textFieldShouldReturn(_ textField: UITextField) -> Bool {
			textField.resignFirstResponder()
			self.textField.isFirstResponder = false
			self.textField.onReturn?(textField)

			return true
		}

		func textFieldDidBeginEditing(_ textField: UITextField) {
			self.textField.onFocusBegan?(textField)
		}

		func textFieldDidEndEditing(_ textField: UITextField) {
			self.textField.isFirstResponder = false
		}

		func textFieldDidChangeSelection(_ textField: UITextField) {
			if let text = textField.text {
				self.textField.onTextChanged?(text)
				DispatchQueue.main.async {
					self.textField.textValue = text
				}
			}
		}
	}
}

struct AppTextField_Previews: PreviewProvider {
	static var previews: some View {
		Window {
			VStack(alignment: .leading, spacing: 10.0) {
				OutlinedTextField(
					textValue: .constant(""),
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
					textValue: .constant(""),
					labelText: "input label",
					placeholder: "placeholder",
					helperText: "optional helper text",
					isFirstResponder: false,
					onTextChanged: { text in
						print(text)
					}
				)
				.padding(8)
			}
		}
	}
}
