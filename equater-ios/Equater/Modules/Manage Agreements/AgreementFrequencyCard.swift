//
//  AgreementFrequencyCard.swift
//  Equater
//
//  Created by Robert B. Menke on 6/28/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct AgreementFrequencyCard: View {
	@InjectedObject private var viewModel: AgreementsViewModel
	var sharedExpense: SharedExpense

	var body: some View {
		Card {
			VStack(alignment: .leading) {
				AppText(self.viewModel.getFrequencyText(sharedExpense: self.sharedExpense), font: .primaryText)
				AppText(self.viewModel.getNextPaymentDateText(sharedExpense: self.sharedExpense), font: .subText)
			}
			.frameFillWidth(height: nil, alignment: .leading)
		}
	}
}

struct AgreementFrequencyCard_Previews: PreviewProvider {
	static var previews: some View {
		AgreementFrequencyCard(sharedExpense: sharedExpenseStoryFake.sharedExpense)
	}
}
