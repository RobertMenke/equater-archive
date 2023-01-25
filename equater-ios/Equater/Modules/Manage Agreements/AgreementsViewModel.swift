//
//  ManageExpensesViewModel.swift
//  Equater
//
//  Created by Robert B. Menke on 5/24/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Resolver
import SwiftEventBus
import SwiftUI
import UIKit

enum AgreementStatus {
	case active
	case pending
	case inactive
}

enum AgreementActionType {
	case accept
	case decline
}

let DEFAULT_PAYMENT_ACCOUNT_ID_KEY = "DEFAULT_PAYMENT_ACCOUNT_ID"

final class AgreementsViewModel: Identifiable, ObservableObject {
	@Injected private var api: SharedExpenseApi
	@Injected private var appState: AppState
	@InjectedObject private var onBoardingViewModel: OnBoardingViewModel

	@Published var sharedExpenses: [SharedExpenseStory] = []
	@Published var selectedTab: ExpenseAgreementTab = .active
	@Published var tabs = ExpenseAgreementTab.getButtons(withActiveTab: .active, numberOfInvitations: 0)
	@Published var onAccountLinked: ((UInt) -> Void)? = nil
	@Published var showSheet = false
	/// Keeps track of whether the user tapped accept or decline so we can figure out whether
	/// or not to ask the payee to link their bank account
	@Published var agreementAction: AgreementActionType = .decline
	/// Keep track of the shared expense id being acted on when accept is tapped
	@Published var sharedExpenseIdForAgreementAction: UInt? = nil
	private var paymentAccountMap: [UInt: UInt] = Dictionary()
	@Published var hasFetchedInitialData = false
	/// When a deep link or a push notification links to a specific agreement, this variable
	/// will be set. The app should automatically navigate to the specific shared expense so that
	/// action can be taken.
	@Published var linkedSharedExpenseId: UInt? = nil
	@Published var linkedSharedExpense: SharedExpenseStory? = nil
	@Published var paymentAccountId: UInt? = nil
	@Published var countOfInvitations: UInt = 0

	/// This is a bit of a hack to automatically accept the shared expense when the disclosure of fees is accepted
	private var onAcceptedDisclosureOfFees: (() -> Void)?

	private var disposables: Set<AnyCancellable> = []

	init() {
		SwiftEventBus.onMainThread(self, name: Event.emailIsConfirmed.rawValue) { _ in
			self.showSheet = false
		}

		SwiftEventBus.onMainThread(self, name: Event.userIsSignedIn.rawValue) { _ in
			if let user = self.appState.user {
				let accountId = UserDefaults.standard.integer(forKey: "\(DEFAULT_PAYMENT_ACCOUNT_ID_KEY)-\(user.id)")
				self.paymentAccountId = accountId != 0 ? UInt(accountId) : nil
			}
		}

		SwiftEventBus.onMainThread(self, name: Event.userIsSignedOut.rawValue) { _ in
			self.paymentAccountId = nil
			self.sharedExpenseIdForAgreementAction = nil
			self.paymentAccountMap = Dictionary()
			self.hasFetchedInitialData = false
			self.sharedExpenses = []
		}
	}

	func showSheet(andThen: @escaping (UInt) -> Void) {
		showSheet = true
		onAccountLinked = andThen
	}

	/// Determine if we either have a payment account saved on file or
	/// have set a payment account in our dictionary mapping shared expense ids
	/// to payment account ids
	func hasPaymentAccount(forSharedExpenseId id: UInt? = nil) -> Bool {
		if paymentAccountId != nil {
			return true
		}

		let sharedExpenseId = id ?? sharedExpenseIdForAgreementAction
		if let expenseId = sharedExpenseId, paymentAccountMap[expenseId] != nil {
			return true
		}

		return false
	}

	/// Save the association between a shared expense id and a payment account id
	/// so it can be referenced in a lookup when accepting an agreement
	func setPaymentAccount(paymentAccountId: UInt, forSharedExpenseId id: UInt? = nil) {
		guard let sharedExpenseId = id ?? sharedExpenseIdForAgreementAction else {
			return
		}

		paymentAccountMap[sharedExpenseId] = paymentAccountId
	}

	/// Attempt to either fetch the universal paymentAccountId (stored in user defaults)
	/// or fallback to looking up a mapping between shared expense ids and payment account ids
	func getPaymentAccountId(sharedExpenseId: UInt? = nil) -> UInt? {
		if let paymentAccountId = paymentAccountId {
			return paymentAccountId
		}

		let sharedExpenseId = sharedExpenseId ?? sharedExpenseIdForAgreementAction

		if let sharedExpenseId = sharedExpenseId, let id = paymentAccountMap[sharedExpenseId] {
			return id
		}

		return nil
	}

	func showDisclosureOfFees(onAccepted: @escaping () -> Void) {
		showSheet = true
		onAcceptedDisclosureOfFees = onAccepted
	}

	/// Fetched on sign-in
	func fetchSharedExpenses(_ onCompleted: (() -> Void)? = nil) {
		api
			.fetchSharedExpenses()
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
					logger.console("Fetched \(stories.count) shared expenses")
					instance.sharedExpenses = stories
					instance.setSelectedTab(instance.selectedTab)
					instance.navigateToLinkedAgreement()
					/// If the user already made it to the migration screen, don't exit from the screen when we detect
					/// shared expenses. Better for them to skip on-boarding then for the app to yank the screen away.
					if stories.count > 0, !(self?.onBoardingViewModel.madeItToMigrationScreen ?? true) {
						// Scenario: User was invited to use Equater so they already an agreement to interact with
						// instead of showing on-boarding, we should show their
						self?.onBoardingViewModel.set(hasSeenOnBoarding: true)
					}
					DispatchQueue.main.async {
						onCompleted?()
						self?.updateAgreementNotification()
					}
					self?.hasFetchedInitialData = true
				}
			)
			.store(in: &disposables)
	}

	func updateAgreement(
		forStory story: SharedExpenseStory,
		doesAccept: Bool,
		paymentAccountId: UInt? = nil,
		completion: @escaping (HttpResponse<SharedExpenseStory>?
		) -> Void
	) {
		guard let user = appState.user else { return }

		if user.id == story.sharedExpense.expenseOwnerUserId, !doesAccept {
			let dto = CancelAgreementDto(sharedExpenseId: story.sharedExpense.id)
			cancelAgreement(dto, completion: completion)
			return
		}

		guard let agreement = getAgreement(forStory: story) else {
			completion(nil)
			return
		}

		let dto = UserAgreementDto(
			userAgreementId: agreement.id,
			doesAcceptAgreement: doesAccept,
			paymentAccountId: paymentAccountId
		)

		updateAgreement(dto: dto, completion: completion)
	}

	private func updateAgreement(dto: UserAgreementDto, completion: @escaping (HttpResponse<SharedExpenseStory>?) -> Void) {
		api
			.updateExpenseAgreement(dto: dto)
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { [weak self] result in
					guard self != nil else { return }
					switch result {
					case .failure(let err):
						debugPrint(err)
						completion(nil)
					case .finished:
						logger.console("Finished updateAgreement")
					}
				},
				receiveValue: { response in
					completion(response)
				}
			)
			.store(in: &disposables)
	}

	func cancelAgreement(_ dto: CancelAgreementDto, completion: @escaping (HttpResponse<SharedExpenseStory>?) -> Void) {
		api
			.cancelAgreement(dto: dto)
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { [weak self] result in
					guard self != nil else { return }
					switch result {
					case .failure(let err):
						debugPrint(err)
						completion(nil)
					case .finished:
						logger.console("Finished cancelAgreement")
					}
				},
				receiveValue: { response in
					completion(response)
				}
			)
			.store(in: &disposables)
	}

	func patchDisclosureOfFeesResponse(_ response: DisclosureOfFeesResponse) {
		// This is a bit of a hack to facilitate automatically proceeding with your acceptance of the agreement
		// that prompted the disclosure of fees modal
		if response == .agreedToFees, let callback = onAcceptedDisclosureOfFees {
			callback()
		}

		onAcceptedDisclosureOfFees = nil

		// Optimistically update the preference
		if var user = appState.user {
			user.disclosureOfFeesResponse = response
			appState.set(user: user)
		}

		api
			.patchDisclosureOfFees(DisclosureOfFeesDto(response: response))
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { $0.log() },
				receiveValue: { [weak self] response in
					if let user = response.body {
						self?.appState.set(user: user)
					}
				}
			)
			.store(in: &disposables)
	}

	func update(story: SharedExpenseStory) {
		// This operation destroys the struct managing the view and automatically navigates back
		// to the parent view. Because of this we set the tab that the agreement appears in.
		sharedExpenses = sharedExpenses.map {
			$0.id == story.id ? story : $0
		}

		// Must manually refresh the tabs
		setSelectedTab(selectedTab)
		updateAgreementNotification()
	}

	func updateAgreementNotification() {
		countOfInvitations = countInvitations()
		let invitationCount = Int(countOfInvitations)
		UIApplication.shared.applicationIconBadgeNumber = invitationCount
		UserDefaults.standard.set(invitationCount, forKey: NOTIFICATION_BADGE_COUNT)
	}

	func moveToStoryTab(_ story: SharedExpenseStory) {
		DispatchQueue.main.async {
			if story.sharedExpense.isActive {
				self.setSelectedTab(.active)
			} else if story.sharedExpense.isPending {
				self.setSelectedTab(.pending)
			} else {
				self.setSelectedTab(.inactive)
			}
		}
	}

	func addOrReplace(story: SharedExpenseStory) {
		if sharedExpenses.first(where: { $0.id == story.id }) != nil {
			update(story: story)
		} else {
			add(story: story)
		}
	}

	/// This should only be used after creating shared expense agreements
	func add(story: SharedExpenseStory) {
		sharedExpenses.insert(story, at: 0)
		updateAgreementNotification()
	}

	func findStory(sharedExpenseId id: UInt) -> SharedExpenseStory? {
		sharedExpenses.first(where: { $0.id == id })
	}

	func setSelectedTab(_ tab: ExpenseAgreementTab) {
		selectedTab = tab
		tabs = createTabButtons()
	}

	private func createTabButtons() -> [RadioButtonModel] {
		ExpenseAgreementTab.getButtons(
			withActiveTab: selectedTab,
			numberOfInvitations: UInt(getInvitations().count)
		)
	}

	/// Get the contribution from an active user
	func getContribution(for story: SharedExpenseStory, and user: User) -> Contribution? {
		if user.id == story.initiatingUser.id {
			return getExpenseOwnerContribution(for: story)
		}

		if let agreement = story.agreements.first(where: { $0.userId == user.id }) {
			return Contribution(contributionType: agreement.contributionType, contributionValue: agreement.contributionValue)
		}

		return nil
	}

	private func getExpenseOwnerContribution(for story: SharedExpenseStory) -> Contribution? {
		guard let agreementType = story.agreements.first?.contributionType ?? story.prospectiveUsers.first?.contributionType else {
			return nil
		}

		switch agreementType {
		case .fixed:
			return Contribution(contributionType: .fixed, contributionValue: nil)
		case .percentage:
			return Contribution(contributionType: .percentage, contributionValue: calculateRemainingPercentageForExpenseOwner(story))
		case .splitEvenly:
			return Contribution(contributionType: .splitEvenly, contributionValue: nil)
		}
	}

	/// Get the contribution from a prospective user
	func getContribution(for story: SharedExpenseStory, and email: String) -> Contribution? {
		if let agreement = story.prospectiveUsers.first(where: { $0.email == email }) {
			return Contribution(contributionType: agreement.contributionType, contributionValue: agreement.contributionValue)
		}

		return nil
	}

	func hasInvitation() -> Bool {
		countInvitations() > 0
	}

	func countInvitations() -> UInt {
		UInt(getInvitations().count)
	}

	/// This determines if the user viewing the app has an active or pending agreement
	func agreementIsPending(forStory story: SharedExpenseStory) -> Bool {
		let agreement = getAgreement(forStory: story)

		return agreement?.isPending ?? false
	}

	func getAgreement(forStory story: SharedExpenseStory) -> SharedExpenseUserAgreement? {
		guard let user = appState.user else { return nil }

		return story.agreements.first(where: { $0.userId == user.id })
	}

	func getSharedExpenses(withStatus status: AgreementStatus) -> [SharedExpenseStory] {
		switch status {
		case .active:
			return sharedExpenses.filter(\.sharedExpense.isActive)
		case .pending:
			return sharedExpenses.filter(\.sharedExpense.isPending)
		case .inactive:
			return sharedExpenses.filter { !$0.sharedExpense.isPending && !$0.sharedExpense.isActive }
		}
	}

	func getActiveSharedExpensesForAccount(account: UserAccount) -> [SharedExpenseStory] {
		let active = getSharedExpenses(withStatus: .active)

		return active.filter { story in
			story.usesAccount(account)
		}
	}

	/// This is a list of shared expenses the currently logged in user needs to respond to
	func getInvitations() -> [SharedExpenseStory] {
		guard let user = appState.user else { return [] }
		let expenses = getSharedExpenses(withStatus: .pending)

		return expenses.filter {
			let agreement = $0.agreements.first(where: { item in item.userId == user.id })

			return agreement?.isPending ?? false
		}
	}

	/// This is a list of agreements that are pending, but don't require the signed in user to take
	/// additional action
	func getPendingAgreementsWithoutInvitation() -> [SharedExpenseStory] {
		guard let user = appState.user else { return [] }
		let expenses = getSharedExpenses(withStatus: .pending)

		return expenses.filter {
			guard let agreement = $0.agreements.first(where: { item in item.userId == user.id }) else { return true }

			return agreement.isActive
		}
	}

	/// Get the agreement status for the currently logged in user
	func getAgreementStatus(forStory story: SharedExpenseStory) -> AgreementStatus? {
		guard let user = appState.user else { return nil }

		return getAgreementStatus(forStory: story, andUser: user)
	}

	func getAgreementStatus(forStory story: SharedExpenseStory, andUser user: User) -> AgreementStatus? {
		guard let agreement = story.agreements.first(where: { $0.userId == user.id }) else { return nil }

		if agreement.isPending {
			return .pending
		}

		if agreement.isActive {
			return .active
		}

		return .inactive
	}

	func getTab(forStory story: SharedExpenseStory) -> ExpenseAgreementTab {
		if story.sharedExpense.isActive {
			return .active
		}

		if story.sharedExpense.isPending {
			return .pending
		}

		return .inactive
	}

	func getFrequencyText(sharedExpense: SharedExpense) -> String {
		guard
			let frequency = sharedExpense.expenseRecurrenceFrequency,
			let recurrenceInterval = sharedExpense.expenseRecurrenceInterval,
			let interval = RecurringExpenseInterval(rawValue: recurrenceInterval),
			let startDate = sharedExpense.targetDateOfFirstCharge?.toISODate()
		else {
			return ""
		}

		return "Every \(interval.getDescriptionLowerCase(frequency)) starting \(startDate.formatMonthDayYear())"
	}

	func getNextPaymentDateText(sharedExpense: SharedExpense) -> String {
		if !sharedExpense.isActive, !sharedExpense.isPending {
			return ""
		}

		guard
			let nextPaymentDue = sharedExpense.dateNextPaymentScheduled,
			let nextDate = nextPaymentDue.toISODate()
		else {
			return ""
		}

		return "Next charge is \(nextDate.formatMonthDayYear())"
	}

	@objc func handleRefresh(sender: UIRefreshControl) {
		fetchSharedExpenses {
			sender.endRefreshing()
		}
	}

	func setLinkedAgreement(bySharedExpenseId id: UInt) {
		linkedSharedExpenseId = id
		if sharedExpenses.count > 0 {
			navigateToLinkedAgreement()
		}
	}

	private func navigateToLinkedAgreement() {
		guard let linkedAgreementId = linkedSharedExpenseId else { return }
		let expense = sharedExpenses.first { $0.id == linkedAgreementId }

		if let linkedExpense = expense {
			linkedSharedExpense = linkedExpense
			if linkedExpense.sharedExpense.isActive {
				setSelectedTab(.active)
			} else if linkedExpense.sharedExpense.isPending {
				setSelectedTab(.pending)
			} else {
				setSelectedTab(.inactive)
			}
		}
		// Reset the linked agreement id to nil so that subsequent loads don't trigger this behavior
		linkedSharedExpenseId = nil
	}

	private func calculateRemainingPercentageForExpenseOwner(_ story: SharedExpenseStory) -> Int {
		var contributions = story.agreements.map { Contribution(contributionType: $0.contributionType, contributionValue: $0.contributionValue) }
		contributions = contributions.combine(
			story.prospectiveUsers.map { Contribution(contributionType: $0.contributionType, contributionValue: $0.contributionValue) }
		)

		let sum = contributions.reduce(0) { acc, contribution -> Int in
			acc + (contribution.contributionValue ?? 0)
		}

		return max(100 - sum, 0)
	}
}
