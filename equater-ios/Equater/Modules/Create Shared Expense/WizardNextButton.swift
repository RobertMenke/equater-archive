//
//  WizardNextButton.swift
//  WizardNextButton
//
//  Created by Robert B. Menke on 7/25/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct WizardNextButton: View {
	@InjectedObject private var onBoardingViewModel: OnBoardingViewModel

	let text: String?
	var buttonText: String
	@Binding var isLoading: Bool
	let onContinue: () -> Void

	var body: some View {
		VStack(alignment: .leading) {
			if let text = text {
				AppText(text, font: .custom(size: 20, color: .textPrimary))
					.bold()
					.multilineTextAlignment(.leading)
			}

			ContainedButton(
				label: buttonText,
				enabled: true,
				size: .custom(width: .infinity, height: 50),
				isLoading: $isLoading,
				onTap: self.onContinue
			)

			if !onBoardingViewModel.hasSeenOnBoarding {
				SkipOnBoarding()
			}
		}
		.padding(.bottom, 54)
	}
}

struct WizardNextButton_Previews: PreviewProvider {
	static var previews: some View {
		WizardNextButton(text: "Some instruction for the next move", buttonText: "Take Action", isLoading: .constant(false)) {
			print("Action taken")
		}
	}
}
