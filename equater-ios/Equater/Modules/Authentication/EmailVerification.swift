//
//  EmailConfirmation.swift
//  Equater
//
//  Created by Robert B. Menke on 7/13/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct EmailVerification: View {
	@InjectedObject private var viewModel: AuthenticationViewModel
	var onDone: () -> Void
	@State private var isLoading = false

	var body: some View {
		Window {
			HeaderWithContentLayout(
				headerHeight: 144,
				header: self.Header,
				content: VStack(alignment: .center) {
					AppImage.mailbox.image
						.resizable()
						.aspectRatio(contentMode: .fit)
						.frameFillWidth(height: nil, alignment: .center)

					AppText("Check your email", font: .title)
					AppText("Before you proceed, we need you to verify your email. Check your inbox (spam folder too!) or use this button to resend the confirmation email.", font: .subtitle)
						.multilineTextAlignment(.leading)
						.lineSpacing(3)
						.offset(y: 3)

					ContainedButton(
						label: "Resend Email Verification",
						enabled: true,
						size: .custom(width: .infinity, height: 50),
						isLoading: self.$isLoading,
						onTap: {
							self.isLoading = true
							self.viewModel.resendEmailConfirmation { err in
								self.isLoading = false
								guard err != nil else {
									showSnackbar(message: "Confirmation email was resent!")
									return
								}

								showSnackbar(message: "Unable to resend confirmation. Are you connected to the internet?")
							}
						}
					)
					.padding(.top, 16)

					Spacer()
				}
				.frameFillParent(alignment: .center)
				.padding([.leading, .trailing], 16)
			)
		}
	}

	var Header: some View {
		VStack {
			HStack {
				Spacer()
				Button(
					action: {
						self.onDone()
					},
					label: {
						Text("Done").bold()
					}
				)
				.foregroundColor(AppColor.accentPrimaryForText.color)
			}
			.frameFillWidth(height: 72, alignment: .bottom)
			.padding(.trailing, 16)

			HStack(alignment: .bottom) {
				Text("Verify Email Address")
					.font(.custom("Inter", size: 32))
					.foregroundColor(AppColor.textPrimary.color)
					.bold()
				Spacer()
			}
			.frameFillWidth(height: 72, alignment: .center)
			.padding(.leading, 16)
		}
	}
}

struct EmailConfirmation_Previews: PreviewProvider {
	static var previews: some View {
		EmailVerification {
			print("Done")
		}
	}
}
