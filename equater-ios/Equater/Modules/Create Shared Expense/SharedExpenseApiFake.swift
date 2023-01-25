//
//  SharedExpenseApiFake.swift
//  Equater
//
//  Created by Robert B. Menke on 6/19/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation

let sharedExpenseFake = SharedExpense(
	id: 1,
	uniqueVendorId: 1,
	expenseOwnerUserId: 1,
	expenseOwnerSourceAccountId: 1,
	expenseOwnerDestinationAccountId: 1,
	uuid: UUID().uuidString,
	expenseNickName: "Great Shared Expense",
	dateTimeCreated: "2020-06-19T19:27:56.426Z",
	isActive: false,
	isPending: true,
	sharedExpenseType: .transactionWebHook,
	expenseRecurrenceInterval: nil,
	expenseRecurrenceFrequency: nil,
	targetDateOfFirstCharge: nil,
	dateLastCharged: nil,
	dateNextPaymentScheduled: nil,
	dateTimeDeactivated: nil
)

let sharedExpenseAgreementFake = SharedExpenseUserAgreement(
	id: 1,
	sharedExpenseId: 1,
	userId: 1,
	uuid: UUID().uuidString,
	paymentAccountId: 1,
	contributionType: .splitEvenly,
	contributionValue: nil,
	isPending: true,
	isActive: false,
	dateTimeCreated: "2020-06-19T19:27:56.426Z",
	dateTimeBecameActive: nil,
	dateTimeBecameInactive: nil
)

let userInviteFake = UserInvite(
	id: 1,
	email: "fake@gmail.com",
	uuid: UUID().uuidString,
	contributionType: .splitEvenly,
	contributionValue: nil,
	dateTimeCreated: "2020-06-19T19:27:56.426Z",
	isConverted: false,
	dateTimeBecameUser: nil
)

let sharedExpenseStoryFake = SharedExpenseStory(
	sharedExpense: sharedExpenseFake,
	initiatingUser: userFake,
	vendor: vendorFake,
	agreements: [sharedExpenseAgreementFake],
	activeUsers: [userFake],
	prospectiveUsers: [userInviteFake]
)

let transactionFake = SharedExpenseTransaction(
	id: 1,
	uuid: UUID().uuidString,
	plaidTransactionId: nil,
	idempotencyToken: UUID().uuidString,
	hasBeenTransferredToDestination: true,
	dateTimeTransferredToDestination: "2020-06-19T19:27:56.426Z",
	dateTimeTransactionScheduled: "2020-06-19T19:27:56.426Z",
	totalFeeAmount: 100,
	totalTransactionAmount: 500,
	sharedExpenseId: 1,
	sharedExpenseUserAgreementId: 1,
	destinationAccountId: 1,
	sourceAccountId: 2,
	destinationUserId: 1,
	sourceUserId: 2,
	dateTimeInitiated: "2020-06-19T19:27:56.426Z",
	dwollaTransferUrl: nil,
	dwollaTransferId: nil,
	numberOfTimesAttempted: 1,
	dwollaStatus: .pending,
	dateTimeDwollaStatusUpdated: "2020-06-19T19:27:56.426Z"
)

let transactionStoryFake = TransactionStory(
	transaction: transactionFake,
	vendor: vendorFake,
	payer: userFake,
	recipient: userFake,
	sharedExpense: sharedExpenseFake,
	sharedExpenseAgreement: sharedExpenseAgreementFake
)

struct SharedExpenseRestServiceFake: RestApiFake, SharedExpenseApi {
	/// Note: This should be reset to false on the setup of every test case
	static var requestShouldFail = false

	func createMerchantSharedExpense(_ dto: CreateVendorWebHookSharedExpenseDto) -> AnyPublisher<HttpResponse<SharedExpenseStory>, AppError> {
		if Self.requestShouldFail {
			return makeFailingRequest(error: .networkError("Failed to retrieve data"))
		}

		return makeRequest(response: SharedExpenseStory(
			sharedExpense: sharedExpenseFake,
			initiatingUser: userFake,
			vendor: vendorFake,
			agreements: [sharedExpenseAgreementFake],
			activeUsers: [userFake],
			prospectiveUsers: [userInviteFake]
		))
	}

	func createRecurringSharedExpense(_ dto: CreateRecurringSharedExpenseDto) -> AnyPublisher<HttpResponse<SharedExpenseStory>, AppError> {
		if Self.requestShouldFail {
			return makeFailingRequest(error: .networkError("Failed to retrieve data"))
		}

		return makeRequest(response: SharedExpenseStory(
			sharedExpense: sharedExpenseFake,
			initiatingUser: userFake,
			vendor: nil,
			agreements: [sharedExpenseAgreementFake],
			activeUsers: [userFake],
			prospectiveUsers: [userInviteFake]
		))
	}

	func fetchSharedExpenses() -> AnyPublisher<HttpResponse<[SharedExpenseStory]>, AppError> {
		if Self.requestShouldFail {
			return makeFailingRequest(error: .networkError("Failed to retrieve data"))
		}

		return makeRequest(response: [
			SharedExpenseStory(
				sharedExpense: sharedExpenseFake,
				initiatingUser: userFake,
				vendor: vendorFake,
				agreements: [sharedExpenseAgreementFake],
				activeUsers: [userFake],
				prospectiveUsers: [userInviteFake]
			),
			SharedExpenseStory(
				sharedExpense: sharedExpenseFake,
				initiatingUser: userFake,
				vendor: nil,
				agreements: [sharedExpenseAgreementFake],
				activeUsers: [userFake],
				prospectiveUsers: [userInviteFake]
			),
		])
	}

	func fetchTransactions() -> AnyPublisher<HttpResponse<[TransactionStory]>, AppError> {
		if Self.requestShouldFail {
			return makeFailingRequest(error: .networkError("Failed to retrieve data"))
		}

		return makeRequest(response: [transactionStoryFake])
	}

	func updateExpenseAgreement(dto: UserAgreementDto) -> AnyPublisher<HttpResponse<SharedExpenseStory>, AppError> {
		if Self.requestShouldFail {
			return makeFailingRequest(error: .networkError("Failed to retrieve data"))
		}

		return makeRequest(response: sharedExpenseStoryFake)
	}

	func cancelAgreement(dto: CancelAgreementDto) -> AnyPublisher<HttpResponse<SharedExpenseStory>, AppError> {
		if Self.requestShouldFail {
			return makeFailingRequest(error: .networkError("Failed to retrieve data"))
		}

		return makeRequest(response: sharedExpenseStoryFake)
	}

	func patchDisclosureOfFees(_ dto: DisclosureOfFeesDto) -> AnyPublisher<HttpResponse<User>, AppError> {
		if Self.requestShouldFail {
			return makeFailingRequest(error: .networkError("Failed to retrieve data"))
		}

		return makeRequest(response: userFake)
	}
}
