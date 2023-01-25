//
//  PasswordResetConfirmation.swift
//  Equater
//
//  Created by Robert B. Menke on 9/8/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct PasswordResetConfirmation: View {
	@InjectedObject var viewModel: AuthenticationViewModel
	@Environment(\.presentationMode) var presentation

	var body: some View {
		Window {
			VStack {
				Spacer()

				AppImage.holdingPhone.image
					.resizable()
					.aspectRatio(contentMode: .fit)
					.frameFillWidth(height: 200, alignment: .center)

				AppText("Sent! Check your email.", font: .title)
					.padding([.leading, .trailing], 16)
				AppText("We sent you an email with instructions on how to reset your password.", font: .subtitle)
					.padding([.leading, .trailing], 32)
					.multilineTextAlignment(.leading)

				Spacer()
			}
		}
		.onAppear {
			self.viewModel.requestPasswordReset()
		}
	}
}

struct PasswordResetConfirmation_Previews: PreviewProvider {
	static var previews: some View {
		PasswordResetConfirmation()
	}
}
