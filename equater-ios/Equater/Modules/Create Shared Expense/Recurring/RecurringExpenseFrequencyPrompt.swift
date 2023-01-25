//
//  RecurringExpenseFrequencyPrompt.swift
//  Equater
//
//  Created by Robert B. Menke on 6/21/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct RecurringExpenseFrequencyPrompt: View {
	@InjectedObject private var viewModel: RecurringExpenseViewModel
	var onEditUserSelection: () -> Void
	var onContinue: () -> Void

	var body: some View {
		VStack(alignment: .center) {
			Section("Payers") {
				EditableHoriztonalUserList(viewModel: self.viewModel, showContribution: false, onEditRequested: self.onEditUserSelection)
			}
			.padding(.bottom, 16)

			AppText("How much and how often would you like to charge?", font: .title)

			ContainedButton(
				label: "Select Dates & Amounts",
				enabled: true,
				size: .custom(width: .infinity, height: 50),
				isLoading: .constant(false),
				onTap: self.onContinue
			)

			Spacer()
		}
		.frameFillParent()
		.padding([.leading, .trailing], 15)
		.padding(.top, 150)
	}
}

struct RecurringExpenseFrequencyPrompt_Previews: PreviewProvider {
	static var previews: some View {
		RecurringExpenseFrequencyPrompt(onEditUserSelection: {}, onContinue: {})
	}
}
