//
//  RecurringExpenseFrequencySelection.swift
//  Equater
//
//  Created by Robert B. Menke on 6/21/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct RecurringExpenseFrequencySelection: View {
	@InjectedObject private var viewModel: RecurringExpenseViewModel
	@Binding var isValid: Bool

	var body: some View {
		HStack(spacing: 15) {
			AppText("Every", font: .custom(size: 16.0, color: .textPrimary))

			PlainTextField(
				textValue: self.$viewModel.expenseFrequencyInput,
				placeholder: "#",
				isFirstResponder: true,
				styleTextField: { textField in
					textField.backgroundColor = AppColor.backgroundSecondary.uiColor
					textField.layer.cornerRadius = 4.0
					textField.textAlignment = .center
					textField.keyboardType = .numberPad
				},
				onTextChanged: { text in
					if let frequency = UInt(text) {
						self.viewModel.expenseFrequency = frequency
						DispatchQueue.main.async {
							self.isValid = self.viewModel.expenseFrequency > 0
						}
					} else {
						self.viewModel.expenseFrequency = 0
						DispatchQueue.main.async {
							self.isValid = false
						}
					}
				},
				onReturn: { _ in
				}
			)
			.overlay(self.getBorderColor())
			.frame(width: 80, height: 45, alignment: .trailing)

			Select(selection: self.getFrequencyDescription())
				.frameFillWidth(height: 45, alignment: .trailing)
				.background(AppColor.backgroundSecondary.color)
				.onTapGesture {
					UIApplication.shared.endEditing()
					self.viewModel.showIntervalSelectionSheet = true
					print(self.viewModel.expenseFrequency)
				}
		}
		.frameFillWidth(height: nil)
		.padding([.leading, .trailing], 8)
	}

	private func getFrequencyDescription() -> String {
		viewModel.interval.getDescription(viewModel.expenseFrequency)
	}

	private func getBorderColor() -> some View {
		let color = isValid ? AppColor.backgroundSecondary.color : Color.red

		return RoundedRectangle(cornerRadius: 4).stroke(color, lineWidth: 1)
	}
}

struct RecurringExpenseFrequencySelection_Previews: PreviewProvider {
	static var previews: some View {
		RecurringExpenseFrequencySelection(isValid: .constant(true))
	}
}
