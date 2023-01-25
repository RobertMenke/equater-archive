//
//  ResetPassword.swift
//  Equater
//
//  Created by Robert B. Menke on 9/8/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct ResetPassword: View {
	@InjectedObject var viewModel: AuthenticationViewModel
	@Environment(\.presentationMode) var presentation
	@State private var shouldShowConfirmationScreen = false

	/// iOS 14 changed aspects of GeometryReader so we have to account for it here
	var divisor: CGFloat {
		if #available(iOS 14, *) {
			return 2
		}

		return 4
	}

	var body: some View {
		GeometryReader { (geo: GeometryProxy) in
			Window {
				VStack(alignment: .leading) {
					AppText("Email", font: .custom(size: 18.0, color: .textPrimary))
						.bold()
						.padding(.bottom, 8)

					EmailTextField(
						text: self.$viewModel.email,
						placeholder: "Your email address",
						isFirstResponder: true,
						styleTextField: { textField in
							textField.returnKeyType = .go
						},
						onReturn: { textField in
							if textField.returnKeyType == .go, self.viewModel.emailIsValid {
								self.shouldShowConfirmationScreen = true
							}
						}
					)

					AppText("Enter the email you signed up with to reset your password.", font: .subText)
				}
				.padding([.leading, .trailing], 16)
				.offset(y: geo.size.height / divisor)
				.navigationBarBackButtonHidden(true)
				.navigationBarItems(leading: closeButton, trailing: nextButton)
			}
		}
	}
}

extension ResetPassword {
	var closeButton: some View {
		Button(
			action: {
				self.presentation.wrappedValue.dismiss()
			},
			label: { Text("Back") }
		)
		.foregroundColor(AppColor.accentPrimaryForText.color)
	}

	var nextButton: some View {
		NavigationLink(
			destination: PasswordResetConfirmation(),
			isActive: self.$shouldShowConfirmationScreen,
			label: { Text("Next") }
		)
		.disabled(!viewModel.emailIsValid)
		.foregroundColor(AppColor.accentPrimaryForText.color)
	}
}

struct ResetPassword_Previews: PreviewProvider {
	static var previews: some View {
		ResetPassword()
	}
}
