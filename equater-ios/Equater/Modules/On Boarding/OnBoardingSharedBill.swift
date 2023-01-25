//
//  OnBoardingSharedBill.swift
//  Equater
//
//  Created by Robert B. Menke on 1/17/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct OnBoardingSharedBill: View {
	var body: some View {
		MerchantSharedExpense()
			.navigationBarTitle(Text("Shared Bill"), displayMode: .inline)
	}
}

struct OnBoardingSharedBill_Previews: PreviewProvider {
	static var previews: some View {
		OnBoardingSharedBill()
	}
}
