//
//  RecurringStartDateView.swift
//  Equater
//
//  Created by Robert B. Menke on 1/4/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct RecurringStartDateView: View {
	@InjectedObject private var onBoardingViewModel: OnBoardingViewModel
	@InjectedObject private var viewModel: RecurringExpenseViewModel

	let onNextTapped: () -> Void

	var body: some View {
		Window {
			VStack(alignment: .leading) {
				AppText("When is the first bill due?", font: .custom(size: 20, color: .textPrimary))
					.bold()
					.padding(.top, 24)
					.multilineTextAlignment(.leading)

				StartDateTextField

				ContainedButton(
					label: "Next",
					enabled: true,
					size: .custom(width: .infinity, height: 50),
					isLoading: .constant(false),
					onTap: {
						if viewModel.startDateIsValid() {
							onNextTapped()
						} else {
							showSnackbar(message: "Start date must be in the future and less than the end date")
						}
					}
				)
				.padding(.top, 48)

				if !onBoardingViewModel.hasSeenOnBoarding {
					SkipOnBoarding()
				}
			}
			.padding([.leading, .trailing], 14)
			.padding(.top, viewModel.isMakingEdit ? 100 : 0)
		}
	}

	private var StartDateTextField: some View {
		PlainTextField(
			textValue: $viewModel.startDateFormatted,
			placeholder: "",
			isSecureEntry: false,
			isFirstResponder: true,
			styleTextField: { (textField: UITextField) in
				textField.backgroundColor = AppColor.backgroundSecondary.uiColor
				textField.layer.cornerRadius = 4.0
				textField.textAlignment = .center
				textField.inputView = viewModel.startDatePicker
				textField.textColor = AppColor.textPrimary.uiColor
				textField.font = AppFont.primaryText.getUIFont().bold()
			}
		)
		.frameFillWidth(height: 45, alignment: .center)
	}
}

struct RecurringStartDateView_Previews: PreviewProvider {
	static var previews: some View {
		RecurringStartDateView {}
	}
}
