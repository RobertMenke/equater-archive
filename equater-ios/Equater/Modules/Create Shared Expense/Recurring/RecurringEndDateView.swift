//
//  RecurringEndDateView.swift
//  Equater
//
//  Created by Robert B. Menke on 1/4/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct RecurringEndDateView: View {
	@InjectedObject private var onBoardingViewModel: OnBoardingViewModel
	@InjectedObject private var viewModel: RecurringExpenseViewModel

	let onNextTapped: () -> Void

	var body: some View {
		Window {
			VStack(alignment: .leading) {
				AppText("When is the last bill due?", font: .custom(size: 20, color: .textPrimary))
					.bold()
					.padding(.top, 24)
					.multilineTextAlignment(.center)

				HStack {
					Spacer()
					Toggle(isOn: $viewModel.isIndefinite, label: {
						AppText("No end date (indefinite)", font: .custom(size: 16, color: .textPrimary))
						Spacer()
					})
				}
				.frameFillWidth(height: nil)

				if !viewModel.isIndefinite {
					EndDateTextField
				}

				ContainedButton(
					label: "Next",
					enabled: true,
					size: .custom(width: .infinity, height: 50),
					isLoading: .constant(false),
					onTap: {
						if viewModel.endDateIsValid() {
							onNextTapped()
						} else {
							showSnackbar(message: "End date must be greater than start date")
						}
					}
				)
				.padding(.top, 24)

				if !onBoardingViewModel.hasSeenOnBoarding {
					SkipOnBoarding()
				}
			}
			.padding([.leading, .trailing], 14)
			.padding(.top, viewModel.isMakingEdit ? 100 : 0)
		}
	}

	private var EndDateTextField: some View {
		PlainTextField(
			textValue: $viewModel.endDateFormatted,
			placeholder: "",
			isSecureEntry: false,
			isFirstResponder: true,
			styleTextField: { (textField: UITextField) in
				textField.backgroundColor = AppColor.backgroundSecondary.uiColor
				textField.layer.cornerRadius = 4.0
				textField.textAlignment = .center
				textField.inputView = viewModel.endDatePicker
				textField.textColor = AppColor.textPrimary.uiColor
				textField.font = AppFont.primaryText.getUIFont().bold()
			}
		)
		.frameFillWidth(height: 45, alignment: .center)
	}
}

struct RecurringEndDateView_Previews: PreviewProvider {
	static var previews: some View {
		RecurringEndDateView {}
	}
}
