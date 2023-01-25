//
//  TransactionDetailView.swift
//  Equater
//
//  Created by Robert B. Menke on 7/5/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct TransactionDetailView: View {
	@InjectedObject private var agreements: AgreementsViewModel
	let transactionStory: TransactionStory

	var body: some View {
		let story = agreements.findStory(sharedExpenseId: transactionStory.sharedExpense.id)

		return Window {
			ScrollView {
				VStack(spacing: 16) {
					Section("Payer") {
						TransactionParticipantUserCard(
							user: self.transactionStory.payer,
							role: .payer,
							amount: self.transactionStory.transaction.totalTransactionAmount
						)
					}

					Section("Recipient") {
						TransactionParticipantUserCard(
							user: self.transactionStory.recipient,
							role: .recipient,
							amount: self.transactionStory.transaction.totalTransactionAmount
						)
					}

					if story != nil {
						Section("Agreement") {
							TransactionAgreementCard(story: story!)
						}
					}

					Section("Detail") {
						TransactionDetailCard(story: self.transactionStory)
					}
				}
				.padding(16)
			}
			.padding(.top, 150)
		}
		.navigationBarTitle(Text(transactionStory.sharedExpense.expenseNickName), displayMode: .inline)
		.onAppear {
			DispatchQueue.global(qos: .default).async {
				logger.info("User reached transaction detail view for transaction \(transactionStory.transaction.id)")
			}
		}
	}
}

struct TransactionDetailView_Previews: PreviewProvider {
	static var previews: some View {
		TransactionDetailView(transactionStory: transactionStoryFake)
	}
}
