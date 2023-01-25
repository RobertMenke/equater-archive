//
//  VerifiedCustomerFormV2.swift
//  Equater
//
//  Created by Robert B. Menke on 7/9/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import MaterialComponents.MaterialTextControls_OutlinedTextFields
import Resolver
import SwiftUI

private let unverifiedCustomerTitle = "Verify Your Identity"
private let verifiedCustomerTitle = "Update Address"
private let unverifiedCustomerSubTitle = "This information helps us keep Equater users safe and secure."
private let verifiedCustomerSubTitle = "Once set, your date of birth and SSN cannot be changed, but you can use this form to update your address."
private let reVerificationSubTitle = "We could not verify your identity. Please update your information or contact \(EnvironmentService.get(.supportEmailAddress)) for assistance."

struct VerifiedCustomerForm: View {
	@InjectedObject private var viewModel: VerifiedCustomerViewModel
	@InjectedObject private var appState: AppState

	@State private var ssnTextFieldFocused = false
	@State private var ssnTextField: UITextField? = nil
	@State private var showApartmentUnitInput = false
	@State private var apartmentUnitFocused = false
	@State private var apartmentUnitTextField: UITextField? = nil
	@State private var dobFocused = false
	@State private var dobTextField: UITextField? = nil
	@State private var ssnCharCount = 0

	var onDone: () -> Void

	var body: some View {
		Window {
			HeaderWithContentLayout(
				headerHeight: 136,
				header: self.Header,
				content: ZStack {
					ScrollView {
						VStack(spacing: 8) {
							AddressOne

							if showApartmentUnitInput {
								AddressTwo
							}

							if self.viewModel.canUpdateSsn {
								SocialSecurityNumber
							}

							if self.viewModel.canUpdateDateOfBirth {
								DateOfBirth
							}
						}
						.frameFillParent()
						.padding([.leading, .trailing], 16)
						.padding(.top, 8)
						.padding(.bottom, 50)
					}
					.frameFillParent()

					VStack {
						Spacer()
						ContainedButton(
							label: "Save",
							enabled: true,
							size: .custom(width: .infinity, height: 50),
							isLoading: self.$viewModel.formSubmissionInProgress,
							onTap: {
								submit()
							}
						)
						.padding(.bottom, 50)
					}
					.frameFillParent(alignment: .bottom)
					.padding([.leading, .trailing], 16)
				}
			)
		}
		.sheet(
			isPresented: self.$viewModel.addressSearchIsDisplayed,
			onDismiss: { self.viewModel.addressSearchIsDisplayed = false },
			content: {
				AddressAutocomplete(isOpen: self.$viewModel.addressSearchIsDisplayed) { either in
					either.fold({ err in logger.error("\(err)") }) { address in
						self.viewModel.address = address
					}
					self.viewModel.addressSearchIsDisplayed = false
					showApartmentUnitInput = true
					apartmentUnitFocused = true
					apartmentUnitTextField?.becomeFirstResponder()
				}
			}
		)
		.onAppear {
			showApartmentUnitInput = !viewModel.canUpdateSsn
		}
		.offset(y: 1.0)
		.navigationTitle(Text("Identity Verification"))
	}

	var Header: some View {
		VStack {
			HStack(alignment: .bottom) {
				AppText(getTitle(), font: .jumbo)
				Spacer()
			}
			.frameFillWidth(height: 72, alignment: .center)
			.padding(.leading, 16)

			AppText(getSubtitle(), font: .custom(size: 15, color: .textSecondary))
				.lineLimit(nil)
				.lineSpacing(3)
				.frameFillWidth(height: 70)
				.offset(y: -10)
				.padding([.leading, .trailing], 16)
		}
	}

	var AddressOne: some View {
		UnderlinedTextField(
			textValue: self.$viewModel.addressText,
			labelText: "Address",
			placeholder: "Address",
			helperText: "This will open an address search sheet",
			isFirstResponder: false,
			styleTextField: { textField in
				self.styleInputBackground(textField)
			},
			isEnabled: false
		)
		.onTapGesture {
			ssnTextFieldFocused = false
			viewModel.addressSearchIsDisplayed = true
		}
	}

	var AddressTwo: some View {
		UnderlinedTextField(
			textValue: self.$viewModel.apartmentUnitText,
			labelText: "Apartment/Suite",
			placeholder: "Apartment/Suite",
			helperText: "Optional",
			isFirstResponder: apartmentUnitFocused,
			styleTextField: { textField in
				self.styleInputBackground(textField)
				textField.returnKeyType = .next
				DispatchQueue.main.async {
					apartmentUnitTextField = textField
				}
			},
			onTextChanged: { text in
				self.viewModel.apartmentUnitText = text
			},
			onReturnKeyTapped: { textField in
				textField.resignFirstResponder()
				ssnTextFieldFocused = true
				ssnTextField?.becomeFirstResponder()
			}
		)
	}

	var SocialSecurityNumber: some View {
		UnderlinedTextField(
			textValue: self.$viewModel.lastFourOfSsn,
			labelText: "Last 4 digits of SSN",
			placeholder: "Last 4 digits of SSN",
			helperText: "End-to-end encrypted",
			isFirstResponder: ssnTextFieldFocused,
			styleTextField: { textField in
				self.styleInputBackground(textField)
				textField.keyboardType = .numberPad
				DispatchQueue.main.async {
					ssnTextField = textField
				}
			},
			onTextChanged: { text in
				if ssnCharCount == 3, text.count == 4 {
					ssnTextField?.resignFirstResponder()
					dobFocused = true
					dobTextField?.becomeFirstResponder()
				}

				if text.count > 4 {
					self.viewModel.lastFourOfSsn = String(self.viewModel.lastFourOfSsn.suffix(4))
				}

				DispatchQueue.main.async {
					ssnCharCount = text.count
				}
			}
		)
	}

	var DateOfBirth: some View {
		UnderlinedTextField(
			textValue: self.$viewModel.dateOfBirthDisplay,
			labelText: "Date of birth",
			placeholder: "Date of birth",
			helperText: "Use the date picker to complete this field",
			isFirstResponder: dobFocused,
			styleTextField: { textField in
				self.styleInputBackground(textField)
				textField.inputView = self.viewModel.datePicker
				DispatchQueue.main.async {
					dobTextField = textField
				}
			}
		)
	}

	private func getTitle() -> String {
		guard let user = appState.user else {
			return unverifiedCustomerTitle
		}

		return user.canReceiveFunds ? verifiedCustomerTitle : unverifiedCustomerTitle
	}

	private func getSubtitle() -> String {
		guard let user = appState.user else {
			return unverifiedCustomerSubTitle
		}

		if user.canReceiveFunds {
			return verifiedCustomerSubTitle
		}

		if user.dwollaReverificationNeeded {
			return reVerificationSubTitle
		}

		return unverifiedCustomerSubTitle
	}

	private func styleInputBackground(_ textField: MDCBaseTextField) {
		if let field = textField as? MDCFilledTextField {
			field.setFilledBackgroundColor(AppColor.backgroundSecondary.uiColor, for: .editing)
			field.setFilledBackgroundColor(AppColor.backgroundSecondary.uiColor, for: .normal)
		}
	}

	private func submit() {
		guard viewModel.formIsValid() else { return }

		let isLoading = viewModel.formSubmissionInProgress
		if !isLoading {
			viewModel.submitForm {
				self.onDone()
			}
		} else if !isLoading {
			showSnackbar(message: "Please fill out each input")
		}
	}
}

struct VerifiedCustomerFormV2_Previews: PreviewProvider {
	static var previews: some View {
		VerifiedCustomerForm {
			print("Done")
		}
	}
}
