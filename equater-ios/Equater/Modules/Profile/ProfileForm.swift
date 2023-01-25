//
//  ProfileForm.swift
//  Equater
//
//  Created by Robert B. Menke on 5/17/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import MaterialComponents.MaterialTextControls_OutlinedTextFields
import Resolver
import SwiftUI

struct ProfileForm: View {
	@InjectedObject var viewModel: ProfileViewModel
	@InjectedObject var photoUploadViewModel: PhotoUploadViewModel
	var user: User
	var showFormInstructions = true
	var onSaveSuccessful: (() -> Void)?

	@State private var lastNameIsFocused = false
	@State private var lastNameTextField: UITextField? = nil

	var body: some View {
		VStack {
			if showFormInstructions {
				ProfileInstructions()
			}

			UnderlinedTextField(
				textValue: self.$viewModel.firstName,
				labelText: "First Name",
				placeholder: "First Name",
				helperText: "(required) Enter your first name",
				isFirstResponder: false,
				styleTextField: { textField in
					self.styleInputBackground(textField)
					textField.text = self.user.firstName
					textField.returnKeyType = .next
					self.viewModel.firstName = self.user.firstName
				},
				onReturnKeyTapped: { textField in
					textField.resignFirstResponder()
					lastNameIsFocused = true
					lastNameTextField?.becomeFirstResponder()
				}
			)

			UnderlinedTextField(
				textValue: self.$viewModel.lastName,
				labelText: "Last Name",
				placeholder: "Last Name",
				helperText: "(required) Enter your last name",
				isFirstResponder: lastNameIsFocused,
				styleTextField: { textField in
					self.styleInputBackground(textField)
					textField.text = self.user.lastName
					textField.returnKeyType = .go
					self.viewModel.lastName = self.user.lastName
					DispatchQueue.main.async {
						lastNameTextField = textField
					}
				},
				onReturnKeyTapped: { textField in
					lastNameIsFocused = false
					textField.resignFirstResponder()
					submit()
				}
			)

			ContainedButton(
				label: self.showFormInstructions ? "Save & Continue" : "Save",
				enabled: true,
				size: .custom(width: .infinity, height: 50),
				isLoading: self.$viewModel.isLoading,
				onTap: {
					submit()
				}
			)
		}
		.padding(15)
		.offset(y: self.showFormInstructions ? 5 : 50)
	}

	private func styleInputBackground(_ textField: MDCBaseTextField) {
		if let field = textField as? MDCFilledTextField {
			field.setFilledBackgroundColor(AppColor.backgroundSecondary.uiColor, for: .editing)
			field.setFilledBackgroundColor(AppColor.backgroundSecondary.uiColor, for: .normal)
		}
	}

	private func formIsValid() -> Bool {
		viewModel.firstName.count > 0 && viewModel.lastName.count > 0
	}

	private func submit() {
		let isValid = formIsValid()
		if isValid, !viewModel.isLoading {
			viewModel.patchName {
				self.onSaveSuccessful?()
			}

			photoUploadViewModel.persistImageUpdates { photo, err in
				if err != nil {
					switch photo {
					case .avatar:
						showSnackbar(message: "Failed to update profile photo")
					case .coverPhoto:
						showSnackbar(message: "Failed to update cover photo")
					default:
						logger.error("Profile form somehow has an instance of Photo that isn't an avatar or cover photo")
					}
				}
			}
		} else if !viewModel.isLoading {
			showSnackbar(message: "Please fill out your first & last name")
		}
	}
}

struct ProfileForm_Previews: PreviewProvider {
	static var previews: some View {
		ProfileForm(user: userFake)
	}
}
