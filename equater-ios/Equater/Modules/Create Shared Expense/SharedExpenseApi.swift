//
//  SharedExpenseApi.swift
//  Equater
//
//  Created by Robert B. Menke on 6/19/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation
import Resolver

protocol SharedExpenseApi {
	/// Creates a shared expense that will be split up given some merchant
	func createMerchantSharedExpense(
		_ dto: CreateVendorWebHookSharedExpenseDto
	) -> AnyPublisher<HttpResponse<SharedExpenseStory>, AppError>

	/// Creates a recurring shared expense starting at some date in the future given some frequency
	func createRecurringSharedExpense(
		_ dto: CreateRecurringSharedExpenseDto
	) -> AnyPublisher<HttpResponse<SharedExpenseStory>, AppError>

	/// Gets a list of all shared expenses this user has created or been invited to participate in
	func fetchSharedExpenses() -> AnyPublisher<HttpResponse<[SharedExpenseStory]>, AppError>

	/// Fetches a list of all transactions this user is involved in as either a recipient or payer
	func fetchTransactions() -> AnyPublisher<HttpResponse<[TransactionStory]>, AppError>

	/// Opt-in or opt-out of a shared expense agreement
	func updateExpenseAgreement(dto: UserAgreementDto) -> AnyPublisher<HttpResponse<SharedExpenseStory>, AppError>

	/// Cancel the agreement outright. This can only be done by the expense owner.
	func cancelAgreement(dto: CancelAgreementDto) -> AnyPublisher<HttpResponse<SharedExpenseStory>, AppError>

	func patchDisclosureOfFees(_ dto: DisclosureOfFeesDto) -> AnyPublisher<HttpResponse<User>, AppError>
}

struct SharedExpenseRestService: SharedExpenseApi {
	@Injected private var session: URLSession
	@Injected private var appState: AppState

	func createMerchantSharedExpense(
		_ dto: CreateVendorWebHookSharedExpenseDto
	) -> AnyPublisher<HttpResponse<SharedExpenseStory>, AppError> {
		let request = HttpRequest<CreateVendorWebHookSharedExpenseDto, SharedExpenseStory>()

		return request.put(apiEndpoint: .createMerchantExpense, requestDto: dto)
	}

	func createRecurringSharedExpense(_ dto: CreateRecurringSharedExpenseDto) -> AnyPublisher<HttpResponse<SharedExpenseStory>, AppError> {
		let request = HttpRequest<CreateRecurringSharedExpenseDto, SharedExpenseStory>()

		return request.put(apiEndpoint: .createRecurringExpense, requestDto: dto)
	}

	func fetchSharedExpenses() -> AnyPublisher<HttpResponse<[SharedExpenseStory]>, AppError> {
		guard let user = appState.user else { return HttpRequest<EmptyRequest, [SharedExpenseStory]>.defaultError() }
		let request = HttpRequest<EmptyRequest, [SharedExpenseStory]>()

		return request.get(apiEndpoint: .fetchSharedExpenses(id: user.id), requestDto: nil)
	}

	func fetchTransactions() -> AnyPublisher<HttpResponse<[TransactionStory]>, AppError> {
		guard let user = appState.user else { return HttpRequest<EmptyRequest, [TransactionStory]>.defaultError() }
		let request = HttpRequest<EmptyRequest, [TransactionStory]>()

		return request.get(apiEndpoint: .fetchTransactions(id: user.id), requestDto: nil)
	}

	func updateExpenseAgreement(dto: UserAgreementDto) -> AnyPublisher<HttpResponse<SharedExpenseStory>, AppError> {
		let request = HttpRequest<UserAgreementDto, SharedExpenseStory>()

		return request.patch(apiEndpoint: .patchExpenseAgreement, requestDto: dto)
	}

	func cancelAgreement(dto: CancelAgreementDto) -> AnyPublisher<HttpResponse<SharedExpenseStory>, AppError> {
		let request = HttpRequest<CancelAgreementDto, SharedExpenseStory>()

		return request.patch(apiEndpoint: .cancelAgreement(id: dto.sharedExpenseId), requestDto: dto)
	}

	func patchDisclosureOfFees(_ dto: DisclosureOfFeesDto) -> AnyPublisher<HttpResponse<User>, AppError> {
		let request = HttpRequest<DisclosureOfFeesDto, User>()

		return request.patch(apiEndpoint: .patchDisclosureOfFees, requestDto: dto)
	}
}
