//
//  MerchantSharedExpenseStep.swift
//  Equater
//
//  Created by Robert B. Menke on 5/27/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation

enum MerchantSharedExpenseStep: UInt, Identifiable, CaseIterable, ProgressStepperDescriptor {
	case selectVendor
	case selectUsers
	case selectSharingModel
	case selectAccount
	case review

	var id: UInt { rawValue }

	func getTitle() -> String {
		switch self {
		case .selectVendor:
			return "Biller"
		case .selectUsers:
			return "Payers"
		case .selectSharingModel:
			return "Split It Up"
		case .selectAccount:
			return "Account"
		case .review:
			return "Review"
		}
	}

	func hasBeenVisited(currentStep: ProgressStepperDescriptor) -> Bool {
		rawValue <= currentStep.getStepIndex()
	}

	func getStepIndex() -> UInt {
		rawValue
	}

	func getSteps() -> [ProgressStepperDescriptor] {
		MerchantSharedExpenseStep.allCases
	}
}

enum RecurringSharedExpenseStep: UInt, CaseIterable, Equatable, Identifiable, ProgressStepperDescriptor {
	case selectFrequency
	case selectStartDate
	case selectEndDate
	case selectUsers
	case selectAmounts
	case selectAccount
	case review

	var id: UInt { rawValue }

	func getTitle() -> String {
		switch self {
		case .selectFrequency:
			return "Frequency"
		case .selectStartDate:
			return "Starting"
		case .selectEndDate:
			return "Ending"
		case .selectUsers, .selectAmounts:
			return "Payers"
		case .selectAccount:
			return "Account"
		case .review:
			return "Review"
		}
	}

	func hasBeenVisited(currentStep: ProgressStepperDescriptor) -> Bool {
		rawValue <= currentStep.getStepIndex()
	}

	func getStepIndex() -> UInt {
		rawValue
	}

	func getSteps() -> [ProgressStepperDescriptor] {
		RecurringSharedExpenseStep.allCases.filter { $0 != .selectAmounts }
	}
}
