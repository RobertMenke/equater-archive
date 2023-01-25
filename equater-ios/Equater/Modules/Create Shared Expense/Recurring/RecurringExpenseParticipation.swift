//
//  RecurringExpenseParticipation.swift
//  Equater
//
//  Created by Robert B. Menke on 6/21/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct RecurringExpenseParticipation: View {
	@InjectedObject private var viewModel: RecurringExpenseViewModel
	var onContinue: () -> Void

	var body: some View {
		ScrollView {
			VStack {
				VStack(spacing: 10) {
					ForEach(self.viewModel.getUsers(), id: \.self) { user in
						RecurringExpenseUserCard(user: .right(user))
					}

					ForEach(self.viewModel.getEmails(), id: \.self) { email in
						RecurringExpenseUserCard(user: .left(email))
					}
				}
				.padding([.leading, .trailing], 2)
				.padding(.bottom, 32)

				ContainedButton(
					label: "Done",
					enabled: true,
					size: .custom(width: .infinity, height: 50),
					isLoading: .constant(false),
					onTap: {
						self.onContinue()
					}
				)
				.frame(height: 50)
			}
			.padding(.top, 16)
			.padding([.leading, .trailing], 14)
		}
	}
}

struct RecurringExpenseParticipation_Previews: PreviewProvider {
	static var previews: some View {
		RecurringExpenseParticipation {
			print("on continue")
		}
	}
}
