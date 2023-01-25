//
//  TransactionDetailCard.swift
//  Equater
//
//  Created by Robert B. Menke on 7/5/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct TransactionDetailCard: View {
	let story: TransactionStory

	var body: some View {
		Card {
			VStack(spacing: 4) {
				HStack {
					AppText(self.getDateDescription(), font: .primaryText)
					Spacer()
					AppText(self.getDate(), font: .subText)
				}
				.frameFillWidth(height: 20, alignment: .bottom)
				.padding([.leading, .trailing], 16)

				Divider()
					.frame(height: 1)
					.background(AppColor.backgroundSecondary.color)
					.padding([.leading, .trailing], 8)

				HStack {
					AppText("Status", font: .primaryText)
					Spacer()
					AppText(self.getStatus(), font: .subText)
				}
				.frameFillWidth(height: 20, alignment: .top)
				.padding([.leading, .trailing], 16)
			}
		}
	}

	private func getDateDescription() -> String {
		let transaction = story.transaction

		if transaction.dateTimeTransferredToDestination != nil {
			return "Paid On"
		}

		if transaction.dateTimeTransactionScheduled != nil {
			return "Scheduled For"
		}

		return "Initiated On"
	}

	private func getDate() -> String {
		let transaction = story.transaction
		let date = transaction.dateTimeTransferredToDestination ?? transaction.dateTimeTransactionScheduled ?? transaction.dateTimeInitiated

		guard let isoDate = date.toISODate() else { return "??" }

		return isoDate.formatMonthDayYear()
	}

	private func getStatus() -> String {
		let status = story.transaction.dwollaStatus?.rawValue ?? "pending"

		return status.capitalizingFirstLetter()
	}
}

struct TransactionDetailCard_Previews: PreviewProvider {
	static var previews: some View {
		TransactionDetailCard(story: transactionStoryFake)
	}
}
