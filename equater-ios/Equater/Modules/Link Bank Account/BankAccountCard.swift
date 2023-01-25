//
//  BankAccountCard.swift
//  Equater
//
//  Created by Robert B. Menke on 12/21/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct BankAccountCard: View {
	let account: UserAccount
	var includeTrailingArrow = false
	let onTap: (UserAccount) -> Void

	var body: some View {
		Card {
			RemoteImage(photo: .plaidInstitution(institution: account.institution)) {
				AppImage.wallet.image.resizable()
			}
			.aspectRatio(contentMode: .fit)
			.frame(width: 70, height: 70)

			VStack(alignment: .leading, spacing: 4) {
				AppText(account.institutionName, font: .primaryText)
					.padding(.leading, 4)
					.lineLimit(1)

				AppText(account.accountName, font: .subText)
					.padding(.leading, 4)
					.font(.system(size: 12))
			}

			if includeTrailingArrow {
				Spacer()
				Image(systemName: "chevron.right")
					.font(.system(size: 16.0, weight: .bold))
					.foregroundColor(AppColor.textPrimary.color)
			}
		}
		.onTapGesture {
			HapticEngine.shared.play(.buttonTap)
			onTap(account)
		}
	}
}

struct BankAccountCard_Previews: PreviewProvider {
	static var previews: some View {
		BankAccountCard(account: userAccountFake) {
			print($0)
		}
	}
}
