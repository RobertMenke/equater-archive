//
//  ExpenseParticipantEmailDisplay.swift
//  Equater
//
//  Created by Robert B. Menke on 5/31/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct ExpenseParticipantEmailDisplay: View {
	var email: String
	var contribution: Contribution?
	var totalParticipants: Int

	var body: some View {
		HStack {
			VStack {
				UserInviteAvatar(email: email, borderColor: AppColor.backgroundPrimary.color)

				if contribution != nil {
					HStack {
						AppText(contribution!.display(totalContributors: totalParticipants), font: .subText)
							.padding(.top, 4)
							.lineLimit(1)
					}
					.frameFillWidth(height: nil, alignment: .center)
				}
			}
			.frameFillHeight(width: 80, alignment: .center)
		}
		.frameFillHeight(width: 80, alignment: .center)
		.padding(2)
		.cornerRadius(8)
		.shadow(radius: 2)
	}
}

struct ExpenseParticipantEmailDisplay_Previews: PreviewProvider {
	static var previews: some View {
		ExpenseParticipantEmailDisplay(
			email: userFake.email,
			contribution: Contribution(contributionType: .splitEvenly, contributionValue: nil),
			totalParticipants: 2
		)
	}
}
