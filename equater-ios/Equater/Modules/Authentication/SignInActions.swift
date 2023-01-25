//
//  SignInActions.swift
//  Equater
//
//  Created by Robert B. Menke on 9/7/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//
import Foundation
import Resolver
import SwiftUI

struct SignInActions: View {
	@InjectedObject var viewModel: AuthenticationViewModel

	var body: some View {
		VStack {
			ContainedButton(
				label: "Get Started",
				enabled: true,
				size: .custom(width: 200, height: 60),
				isLoading: .constant(false),
				onTap: {
					self.viewModel.authFlow = AuthenticationFlow.registration
					self.viewModel.authFlowIsActive = true
				}
			)

			TextButton(
				label: "Sign In",
				enabled: true,
				size: .custom(width: 200, height: 60),
				isLoading: .constant(false),
				textColor: .textSecondary,
				onTap: {
					self.viewModel.authFlow = AuthenticationFlow.signIn
					self.viewModel.authFlowIsActive = true
				}
			)
		}
	}
}

struct SignInActions_Previews: PreviewProvider {
	static var previews: some View {
		SignInActions()
	}
}
