//
//  RecurringExpenseDetails.swift
//  Equater
//
//  Created by Robert B. Menke on 6/20/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct RecurringExpenseAmountSelection: View {
	@InjectedObject private var viewModel: RecurringExpenseViewModel
	var onContinue: () -> Void

	var body: some View {
		Window {
			HeaderWithContentLayout(
				headerHeight: 144,
				header: self.Header,
				content: RecurringExpenseParticipation(onContinue: self.onContinue)
			)
		}
	}

	var Header: some View {
		VStack {
			HStack {
				Spacer()
				Button(
					action: {
						self.onContinue()
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
				AppText("Select Amounts", font: .jumbo)
				Spacer()
			}
			.frameFillWidth(height: 72, alignment: .center)
			.padding(.leading, 16)
		}
	}
}

struct RecurringExpenseDetails_Previews: PreviewProvider {
	static var previews: some View {
		RecurringExpenseAmountSelection {}
	}
}
