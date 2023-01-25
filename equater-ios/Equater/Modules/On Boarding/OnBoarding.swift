//
//  OnBoarding.swift
//  TeamPay
//
//  Created by Robert B. Menke on 9/2/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

let onBoardingSteps = [
	OnBoardingStep(
		title: "Title 1",
		subtitle: "sub title for page 1",
		iconImage: "bills.png"
	),
	OnBoardingStep(
		title: "Title 2",
		subtitle: "sub title for page 2",
		iconImage: "bills.png"
	),
	OnBoardingStep(
		title: "Title 3",
		subtitle: "sub title for page 2",
		iconImage: "bills.png"
	),
]

let steps = onBoardingSteps.map { UIHostingController(rootView: $0) }

struct OnBoarding: View {
	@InjectedObject var authenticationViewModel: AuthenticationViewModel

	var body: some View {
		Window {
			OnBoardingPageView(controllers: steps)

			PageControl(
				numberOfPages: steps.count,
				currentStep: self.$authenticationViewModel.currentStep
			)
			.padding(.all)

			SignInActions().padding(.bottom, 40)
		}
		.sheet(isPresented: self.$authenticationViewModel.authFlowIsActive) {
			Group {
				if self.authenticationViewModel.authFlow == .registration {
					RegistrationEmail()
				} else {
					SignInEmail()
				}
			}
		}
	}
}

struct OnBoarding_Previews: PreviewProvider {
	static var previews: some View {
		OnBoarding()
	}
}
