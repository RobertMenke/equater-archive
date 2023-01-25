//
//  SignIn.swift
//  Equater
//
//  Created by Robert B. Menke on 12/29/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct SignIn: View {
	@InjectedObject var viewModel: AuthenticationViewModel
	@Environment(\.presentationMode) var presentation
	@State var shouldShowPasswordView = false

	@State private var emailField: UITextField? = nil
	@State private var emailIsFirstResponder = true
	@State private var passwordField: UITextField? = nil
	@State private var passwordIsFirstResponder = false
	@State private var formIsValid = false

	var body: some View {
		GeometryReader { (_: GeometryProxy) in
			NavigationView {
				Window {
					VStack(alignment: .leading) {
						AppText("Email", font: .custom(size: 18.0, color: .textPrimary))
							.bold()
							.padding(.bottom, 8)

						EmailTextField(
							text: self.$viewModel.email,
							placeholder: "Enter your email address",
							isFirstResponder: emailIsFirstResponder,
							styleTextField: { textField in
								DispatchQueue.main.async {
									self.emailField = textField
								}
							},
							onReturn: { _ in
								if formIsValid {
									self.signIn()
								} else {
									emailIsFirstResponder = false
									passwordIsFirstResponder = true
									emailField?.resignFirstResponder()
									passwordField?.becomeFirstResponder()
								}
							}
						)

						AppText("Password", font: .custom(size: 18.0, color: .textPrimary))
							.bold()
							.padding(.top, 20)
							.padding(.bottom, 8)

						PasswordTextField(
							text: self.$viewModel.password,
							placeholder: "Enter your password",
							isFirstResponder: passwordIsFirstResponder,
							styleTextField: { textField in
								DispatchQueue.main.async {
									self.passwordField = textField
								}
							},
							onReturn: { _ in
								self.signIn()
							}
						)

						NavigationLink(
							destination: ResetPassword(),
							label: {
								Text("Reset Password")
									.font(AppFont.primaryText.getFont())
									.underline()
									.foregroundColor(AppColor.textPrimary.color)
									.padding(.top, 8)
									.padding(.bottom, 16)
							}
						)
						.disabled(self.viewModel.signInRequestInProgress)

						if self.viewModel.signInPasswordError.count > 0 {
							HStack {
								AppText(self.viewModel.signInPasswordError, font: .custom(size: 14, color: .white))
							}
							.frameFillWidth(height: 50, alignment: .center)
							.background(AppColor.redDecline.color)
							.cornerRadius(8)
							.transition(.opacity)
							.onTapGesture {
								emailIsFirstResponder = false
								passwordIsFirstResponder = true
								emailField?.resignFirstResponder()
								passwordField?.becomeFirstResponder()
								withAnimation {
									self.viewModel.signInPasswordError = ""
								}
							}
						} else {
							ContainedButton(
								label: "Sign In",
								enabled: true,
								size: .custom(width: .infinity, height: 50),
								isLoading: self.$viewModel.signInRequestInProgress,
								onTap: {
									self.signIn()
								}
							)
							.transition(.opacity)
						}
					}
					.padding(.top, 60)
					.padding([.leading, .trailing], 16)
					.navigationBarItems(
						leading: self.closeButton,
						trailing: self.nextButton
					)
					.navigationBarTitle("", displayMode: .inline) // necessary for a compact nav bar
				}
			}
			.foregroundColor(AppColor.accentPrimaryForText.color)
		}
		.onChange(of: self.viewModel.password) { _ in
			withAnimation {
				formIsValid = emailAndPasswordInputsAreValid()
				self.viewModel.signInPasswordError = ""
			}
		}
		.onChange(of: self.viewModel.email) { _ in
			withAnimation {
				formIsValid = emailAndPasswordInputsAreValid()
				self.viewModel.signInPasswordError = ""
			}
		}
		.onAppear {
			// Users can come from the registration screen to this screen so we need to pre-populate the validitiy of the form
			formIsValid = emailAndPasswordInputsAreValid()
		}
	}

	func emailAndPasswordInputsAreValid() -> Bool {
		viewModel.password.count > 0 && viewModel.emailIsValid
	}

	func signIn() {
		if !formIsValid {
			showSnackbar(message: "Enter a valid email and password")
			return
		}

		viewModel.signInRequestInProgress = true
		viewModel.signIn()
	}

	var closeButton: some View {
		Button(
			action: {
				self.presentation.wrappedValue.dismiss()
			},
			label: { Text("Close") }
		)
		.foregroundColor(AppColor.accentPrimaryForText.color)
	}

	var nextButton: some View {
		Button(
			action: {
				self.signIn()
			},
			label: {
				Group {
					if self.viewModel.signInRequestInProgress {
						ActivityIndicator(
							isAnimating: self.$viewModel.signInRequestInProgress,
							style: .medium
						)
					} else {
						Text("Sign In")
					}
				}
			}
		)
		.foregroundColor(AppColor.accentPrimaryForText.color)
	}
}

struct SignIn_Previews: PreviewProvider {
	static var previews: some View {
		SignIn()
	}
}
