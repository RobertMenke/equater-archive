//
//  RecurringFrequencyView.swift
//  Equater
//
//  Created by Robert B. Menke on 1/4/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct RecurringFrequencyView: View {
	@InjectedObject private var onBoardingViewModel: OnBoardingViewModel
	@InjectedObject private var viewModel: RecurringExpenseViewModel
	@State var isValid = true
	let onNextTapped: () -> Void

	var body: some View {
		Window {
			Spacer()
			VStack(alignment: .leading) {
				// The word break here is not working properly on iOS 15. This is a hack to get the text
				// looking the way that it should be.
				AppText("How often will you be collecting", font: .custom(size: 20, color: .textPrimary))
					.bold()
					.multilineTextAlignment(.leading)

				AppText("payment?", font: .custom(size: 20, color: .textPrimary))
					.bold()
					.multilineTextAlignment(.leading)

				RecurringExpenseFrequencySelection(isValid: $isValid)

				ContainedButton(
					label: "Next",
					enabled: true,
					size: .custom(width: .infinity, height: 50),
					isLoading: .constant(false),
					onTap: {
						if isValid {
							onNextTapped()
						} else {
							showSnackbar(message: "Specify a number of days or months")
						}
					}
				)

				if !onBoardingViewModel.hasSeenOnBoarding {
					SkipOnBoarding()
				}
			}
			.padding([.leading, .trailing], 14)
			.padding(.bottom, 70)

			Spacer()
		}
	}
}

struct RecurringFrequencyView_Previews: PreviewProvider {
	static var previews: some View {
		RecurringFrequencyView {}
	}
}
