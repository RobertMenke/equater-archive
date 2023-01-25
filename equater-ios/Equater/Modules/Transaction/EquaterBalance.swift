//
//  EquaterBalance.swift
//  Equater
//
//  Created by Robert B. Menke on 11/8/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct EquaterBalance: View {
	@InjectedObject private var viewModel: ProfileViewModel

	var body: some View {
		Window {
			VStack {
				HStack {
					AppText("Equater Balance", font: .title)
					Spacer()
					AppText(viewModel.getTotalBalanceFormatted(), font: .title)
				}
				.frameFillWidth(height: 40)
				.padding(.top, 32)

				VStack(alignment: .leading) {
					AppText("In rare cases when a transaction doesn’t succeed, funds may temporarily be stored by Equater as an Equater Balance.", font: .subtitle)
						.lineSpacing(3)
						.padding([.top, .bottom], 8)

					AppText("If you’d like to learn more, contact support at (727) 437-2069 or email support@equater.app.", font: .subtitle)
						.lineSpacing(3)
				}
			}
			.padding([.leading, .trailing], 16)
		}
		.offset(y: 1)
		.navigationBarTitle(Text("Balance"), displayMode: .inline)
	}
}

struct EquaterBalance_Previews: PreviewProvider {
	static var previews: some View {
		EquaterBalance()
	}
}
