//
//  TransactionParticipantUserCard.swift
//  Equater
//
//  Created by Robert B. Menke on 7/5/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

enum TransactionParticipantRole {
	case payer
	case recipient
}

struct TransactionParticipantUserCard: View {
	var user: User
	var role: TransactionParticipantRole
	var amount: Int

	@State private var profileImage: UIImage? = nil

	var body: some View {
		Card {
			ProfilePhotoAvatar(user: self.user, image: self.$profileImage)

			VStack(alignment: .leading) {
				AppText("\(self.user.firstName) \(self.user.lastName)", font: .primaryText)
					.padding(.leading, 4)

				// Specialized case for things like the account reserved for deleted users' transactions
				if self.user.email.firstIndex(of: "@") != nil {
					AppText(self.user.email, font: .subText)
						.padding(.leading, 4)
				}
			}
			.frameFillWidth(height: nil, alignment: .leading)

			Spacer()

			AppText(self.getAmount(), font: .custom(size: 16, color: self.getColor()))
		}
	}

	private func getAmount() -> String {
		let decimal = Decimal(integerLiteral: amount)

		return NSDecimalNumber.currencyDisplay(decimal: decimal / 100) ?? "$\(decimal / 100)"
	}

	private func getColor() -> AppColor {
		if role == .payer {
			return .lightRedDecline
		}

		return .lightGreenAccept
	}
}

struct TransactionParticipantUserCard_Previews: PreviewProvider {
	static var previews: some View {
		TransactionParticipantUserCard(user: userFake, role: .payer, amount: 5523)
	}
}
