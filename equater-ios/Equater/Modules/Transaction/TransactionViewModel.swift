//
//  TransactionViewModel.swift
//  Equater
//
//  Created by Robert B. Menke on 7/4/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Resolver
import SwiftEventBus
import UIKit

enum TransactionFilter: Equatable, Identifiable {
	var id: Int {
		switch self {
		case .merchant(let vendor):
			return vendor.id
		case .recurring:
			return -1
		case .none:
			return -2
		}
	}

	case merchant(vendor: Vendor)
	case recurring
	case none
}

final class TransactionViewModel: Identifiable, ObservableObject {
	@Injected private var api: SharedExpenseApi
	@Published var transactions: [TransactionStory] = []
	@Published var filteredTransactions: [TransactionStory] = []
	@Published var transactionFilter: TransactionFilter = .none {
		didSet {
			SwiftEventBus.post(Event.transactionFilterSelected.rawValue)
		}
	}

	@Published var transactionFilterList: [TransactionFilter] = []
	@Published var hasFetchedInitialData = false
	/// When a deep link or a push notification links to a specific transaction, this variable
	/// will be set. The app should automatically navigate to the specific transaction so that
	/// action can be taken.
	@Published var linkedTransactionId: UInt? = nil
	@Published var linkedTransaction: TransactionStory? = nil

	private var disposables: Set<AnyCancellable> = []

	func fetchTransactions(_ onCompleted: (() -> Void)? = nil) {
		api
			.fetchTransactions()
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { [weak self] completion in
					guard self != nil else { return }
					switch completion {
					case .failure(let err):
						debugPrint(err)
						onCompleted?()
						self?.hasFetchedInitialData = true
					case .finished:
						logger.console("Finished fetchSharedExpenses")
						self?.hasFetchedInitialData = true
					}
				},
				receiveValue: { [weak self] response in
					guard let instance = self else { return }
					guard let stories = response.body else { return }
					logger.console("Fetched \(stories.count) transactions")
					instance.transactions = stories
					self?.filterTransactions()
					self?.buildTransactionFilterList()
					instance.navigateToLinkedTransaction()
					onCompleted?()
					self?.hasFetchedInitialData = true
				}
			)
			.store(in: &disposables)
	}

	private func filterTransactions() {
		switch transactionFilter {
		case .merchant(let vendor):
			filteredTransactions = transactions.filter {
				$0.sharedExpense.sharedExpenseType == .transactionWebHook && $0.vendor?.id == vendor.id
			}
		case .recurring:
			filteredTransactions = transactions.filter { $0.sharedExpense.sharedExpenseType == .recurringDateAndTime }
		case .none:
			filteredTransactions = transactions
		}
	}

	private func buildTransactionFilterList() {
		var list: [TransactionFilter] = []

		for item in transactions {
			var filter: TransactionFilter = .none
			if item.sharedExpense.sharedExpenseType == .recurringDateAndTime {
				filter = .recurring
			} else if let vendor = item.vendor {
				filter = .merchant(vendor: vendor)
			}

			if filter != .none, !list.contains(filter) {
				if filter == .recurring {
					list.insert(filter, at: 0)
				} else {
					list.append(filter)
				}
			}
		}

		transactionFilterList = list
	}

	func setTransactionFilter(_ filter: TransactionFilter) {
		transactionFilter = filter
		filterTransactions()
	}

	func getPendingTransactions() -> [TransactionStory] {
		transactions.filter { !$0.transaction.hasBeenTransferredToDestination }
	}

	func getCompletedTransactions() -> [TransactionStory] {
		transactions.filter(\.transaction.hasBeenTransferredToDestination)
	}

	@objc func handleRefresh(sender: UIRefreshControl) {
		fetchTransactions {
			sender.endRefreshing()
		}
	}

	func setLinkedTransaction(byId id: UInt) {
		linkedTransactionId = id
		if transactions.count > 0 {
			navigateToLinkedTransaction()
		}
	}

	func update(_ story: TransactionStory) {
		transactions = transactions.map { transaction in
			transaction.id == story.id ? story : transaction
		}
	}

	func addOrReplace(_ story: TransactionStory) {
		if transactions.first(where: { $0.id == story.id }) != nil {
			update(story)
		} else {
			transactions.insert(story, at: 0)
		}
	}

	private func navigateToLinkedTransaction() {
		guard let transactionId = linkedTransactionId else { return }
		let transactionStory = transactions.first { story -> Bool in
			story.transaction.id == transactionId
		}

		if let transaction = transactionStory {
			linkedTransaction = transaction
		}

		// Reset the linked transaction id to nil so that subsequent loads don't trigger this behavior
		linkedTransactionId = nil
	}
}
