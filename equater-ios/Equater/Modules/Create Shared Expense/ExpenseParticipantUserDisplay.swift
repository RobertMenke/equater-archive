//
//  ExpenseParticipantUserDisplay.swift
//  Equater
//
//  Created by Robert B. Menke on 5/31/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct ExpenseParticipantUserDisplay: View {
	var user: User
	var contribution: Contribution?
	var totalParticipants: Int

	@State private var profileImage: UIImage? = nil

	var body: some View {
		HStack {
			VStack(alignment: .center) {
				ProfilePhotoAvatar(user: user, image: self.$profileImage, borderColor: AppColor.backgroundPrimary.color)

				if let contribution = contribution {
					HStack {
						AppText(contribution.display(totalContributors: totalParticipants), font: .subText)
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
	}
}

struct ExpenseParticipantUserDisplay_Previews: PreviewProvider {
	static var previews: some View {
		ExpenseParticipantUserDisplay(
			user: userFake,
			contribution: Contribution(contributionType: .splitEvenly, contributionValue: nil),
			totalParticipants: 2
		)
	}
}
