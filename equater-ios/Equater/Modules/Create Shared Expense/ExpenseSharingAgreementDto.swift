import Foundation

enum ExpenseContributionType: UInt, CaseIterable, Codable {
	case percentage = 0
	case fixed = 1
	case splitEvenly = 2
}

enum RecurringExpenseInterval: UInt, CaseIterable, Codable {
	case days = 0
	case months = 1

	var description: String {
		switch self {
		case .days:
			return "Days"
		case .months:
			return "Months"
		}
	}

	var singularDescription: String {
		switch self {
		case .days:
			return "Day"
		case .months:
			return "Month"
		}
	}

	func getDescription(_ frequency: UInt) -> String {
		frequency == 1 ? singularDescription : "\(frequency) \(description)"
	}

	func getDescriptionLowerCase(_ frequency: UInt) -> String {
		let description = getDescription(frequency)

		return description.lowercased()
	}
}

struct Contribution: Codable {
	let contributionType: ExpenseContributionType

	/// Number rounded to the nearest cent for fixed amounts. No support for
	/// fractions of a percent for V1.
	/// For percentage amounts, this will be expressed as a whole number (e.g. 50% = 50)
	/// For fixed expenses, the expense owner's contribution value will be nil and will be displayed
	/// as "Remainder"
	let contributionValue: Int?

	/// By default, always use "Split Evenly"
	static func getDefault() -> Contribution {
		Contribution(contributionType: .splitEvenly, contributionValue: nil)
	}
}

extension Contribution {
	/// The default, "??" should never be displayed in practice. If these show up, there's a programming error upstream
	func display(totalContributors: Int) -> String {
		switch contributionType {
		case .splitEvenly:
			return "1/\(totalContributors)"
		case .percentage:
			guard let value = contributionValue else { return "??" }
			return "\(value)%"
		case .fixed:
			guard let value = contributionValue else { return "Remainder" }
			guard let currency = NSDecimalNumber.currencyDisplay(decimal: Decimal(value) / 100) else { return "??" }

			return currency
		}
	}
}

struct CreateVendorWebHookSharedExpenseDto: Codable {
	/// Expense sharing agreements can be initiated containing both active users
	/// and users we've invited to the platform. [activeUsers] is an array of
	/// user ids corresponding to users that are already on the platform.
	let activeUsers: [String: Contribution]

	/// Expense sharing agreements can be initiated containing both active users
	/// and users we've invited to the platform. [prospectiveUsers] is an array of
	/// email addresses corresponding to users that should be invited to the platform.
	let prospectiveUsers: [String: Contribution]

	/// Name we'll be using to refer to this expense when we communicate with users
	let expenseNickName: String
	let uniqueVendorId: Int

	/// Can be a credit card. This is the account we'll use to match transactions to shared bills.
	let expenseOwnerSourceAccountId: UInt

	/// Must be a depository account. This is the account we'll use to deposit/withdraw money from.
	let expenseOwnerDestinationAccountId: UInt
}

struct CreateRecurringSharedExpenseDto: Codable {
	/// Expense sharing agreements can be initiated containing both active users
	/// and users we've invited to the platform. [activeUsers] is an array of
	/// user ids corresponding to users that are already on the platform.
	let activeUsers: [String: Contribution]

	/// Expense sharing agreements can be initiated containing both active users
	/// and users we've invited to the platform. [prospectiveUsers] is an array of
	/// email addresses corresponding to users that should be invited to the platform.
	let prospectiveUsers: [String: Contribution]

	/// Name we'll be using to refer to this expense when we communicate with users
	let expenseNickName: String

	let interval: RecurringExpenseInterval

	let expenseFrequency: UInt

	/// ISO string
	let startDate: String

	/// ISO string or null for indefinite
	let endDate: String?

	let expenseOwnerDestinationAccountId: UInt
}

struct SharedExpense: Codable, Hashable, Identifiable {
	let id: UInt
	let uniqueVendorId: UInt?
	let expenseOwnerUserId: UInt
	let expenseOwnerSourceAccountId: UInt
	let expenseOwnerDestinationAccountId: UInt
	let uuid: String
	let expenseNickName: String
	let dateTimeCreated: String // iso8601
	let isActive: Bool
	let isPending: Bool
	let sharedExpenseType: SharedExpenseType
	let expenseRecurrenceInterval: UInt?
	let expenseRecurrenceFrequency: UInt?
	let targetDateOfFirstCharge: String? // iso8601
	let dateLastCharged: String? // iso8601
	let dateNextPaymentScheduled: String? // iso8601
	let dateTimeDeactivated: String? // iso8601
}

struct SharedExpenseUserAgreement: Codable, Hashable, Identifiable {
	let id: UInt
	let sharedExpenseId: UInt
	let userId: UInt
	let uuid: String
	let paymentAccountId: UInt?
	let contributionType: ExpenseContributionType
	let contributionValue: Int?
	let isPending: Bool
	let isActive: Bool
	let dateTimeCreated: String // iso8601
	let dateTimeBecameActive: String? // iso8601
	let dateTimeBecameInactive: String? // iso8601
}

struct UserInvite: Codable, Hashable, Identifiable {
	let id: UInt
	let email: String
	let uuid: String
	let contributionType: ExpenseContributionType
	let contributionValue: Int?
	let dateTimeCreated: String // iso8601
	let isConverted: Bool
	let dateTimeBecameUser: String? // iso8601
}

enum SharedExpenseType: UInt, Codable {
	case transactionWebHook = 0
	case recurringDateAndTime = 1
}

struct SharedExpenseStory: Codable, Hashable, Identifiable {
	var id: UInt { sharedExpense.id }
	let sharedExpense: SharedExpense
	let initiatingUser: User
	let vendor: Vendor?
	let agreements: [SharedExpenseUserAgreement]
	let activeUsers: [User]
	let prospectiveUsers: [UserInvite]

	func usesAccount(_ account: UserAccount) -> Bool {
		agreementOwnerUsesAccount(account) || payeeUsesAccount(account)
	}

	private func agreementOwnerUsesAccount(_ account: UserAccount) -> Bool {
		sharedExpense.expenseOwnerSourceAccountId == account.id
			|| sharedExpense.expenseOwnerDestinationAccountId == account.id
	}

	private func payeeUsesAccount(_ account: UserAccount) -> Bool {
		agreements.contains { agreement in
			agreement.paymentAccountId == account.id
		}
	}
}

struct UserAgreementDto: Codable {
	let userAgreementId: UInt
	let doesAcceptAgreement: Bool
	/// Payment account is null when declining agreement
	let paymentAccountId: UInt?
}

struct CancelAgreementDto: Codable {
	let sharedExpenseId: UInt
}

enum DwollaTransferStatus: String, Codable, CaseIterable, Hashable {
	case pending
	case processed
	case failed
	case canceled = "cancelled"
}

struct SharedExpenseTransaction: Codable, Hashable, Identifiable {
	let id: UInt
	let uuid: String
	let plaidTransactionId: UInt?
	let idempotencyToken: String
	let hasBeenTransferredToDestination: Bool
	let dateTimeTransferredToDestination: String? // iso string
	let dateTimeTransactionScheduled: String? // iso string
	let totalFeeAmount: Int
	let totalTransactionAmount: Int
	let sharedExpenseId: UInt
	let sharedExpenseUserAgreementId: UInt
	let destinationAccountId: UInt
	let sourceAccountId: UInt
	let destinationUserId: UInt
	let sourceUserId: UInt
	let dateTimeInitiated: String
	let dwollaTransferUrl: String?
	let dwollaTransferId: String?
	let numberOfTimesAttempted: UInt
	let dwollaStatus: DwollaTransferStatus?
	let dateTimeDwollaStatusUpdated: String? // iso string
}

struct TransactionStory: Codable, Hashable, Identifiable {
	var id: UInt { transaction.id }
	let transaction: SharedExpenseTransaction
	let vendor: Vendor?
	let payer: User
	let recipient: User
	let sharedExpense: SharedExpense
	let sharedExpenseAgreement: SharedExpenseUserAgreement
}

extension SharedExpense {
	func getStatusDisplay() -> String {
		if isActive {
			return "Active"
		}

		if isPending {
			return "Pending"
		}

		return "Canceled"
	}
}

extension SharedExpenseStory {
	func getContributionDisplayForOwner(_ user: User) -> String {
		let totalContributors = activeUsers.count + prospectiveUsers.count + 1

		switch sharedExpense.sharedExpenseType {
		case .transactionWebHook:
			if let agreementType = agreements.first?.contributionType {
				switch agreementType {
				case .fixed:
					return "Pays the remainder of the bill"
				case .percentage:
					let sum = agreements.reduce(0) { acc, value in
						acc + (value.contributionValue ?? 0)
					}
					let difference = 100 - sum
					let percentage = String(max(0, difference))
					return "Pays \(percentage)%"
				case .splitEvenly:
					let contribution = Contribution(contributionType: .splitEvenly, contributionValue: nil)
					return "Pays \(contribution.display(totalContributors: totalContributors))"
				}
			} else {
				return user.email
			}
		case .recurringDateAndTime:
			let total = agreements.reduce(0) { acc, value in
				acc + (value.contributionValue ?? 0)
			}
			let contribution = Contribution(contributionType: .fixed, contributionValue: total)
			return "Receives \(contribution.display(totalContributors: totalContributors))"
		}
	}

	func getStatusDisplay() -> String {
		sharedExpense.getStatusDisplay()
	}
}
