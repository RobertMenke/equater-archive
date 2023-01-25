//
//  OnBoardingRecurringExpense.swift
//  Equater
//
//  Created by Robert B. Menke on 1/17/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct OnBoardingRecurringExpense: View {
	var body: some View {
		RecurringSharedExpense()
			.navigationBarTitle(Text("Recurring Expense"), displayMode: .inline)
	}
}

struct OnBoardingRecurringExpense_Previews: PreviewProvider {
	static var previews: some View {
		OnBoardingRecurringExpense()
	}
}
