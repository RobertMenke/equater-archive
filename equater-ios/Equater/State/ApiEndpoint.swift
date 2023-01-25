//
//  ApiEndpoint.swift
//  Equater
//
//  Created by Robert B. Menke on 10/14/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Foundation

enum ApiEndpoint {
	case fetchEnvironment
	case register
	case signIn
	case passwordReset
	case resendEmailVerification
	case getUser
	case getUserAccounts

	case preSignedPhotoUploadUrl
	case preSignedPhotoDownloadUrl
	case photoUploadStatus
	case recipientOfFunds
	case patchAddress
	case patchDisclosureOfFees
	case patchOnBoardingFeedback
	case getUserBalance
	case linkBankAccount
	case updateBankAccount(id: UInt)
	case unlinkBankAccount(id: UInt)
	case patchName
	case legalDocsAcceptance
	case registerDevice
	case searchUsers
	case fetchRelationships(id: UInt)
	case searchVendors
	case fetchPopularVendors
	case permanentlyDeleteAccount(id: UInt)

	/// Google maps
	case createVendorFromGooglePlace

	/// Shared Expenses
	case createMerchantExpense
	case createRecurringExpense
	case fetchSharedExpenses(id: UInt)
	case fetchTransactions(id: UInt)
	case patchExpenseAgreement
	case cancelAgreement(id: UInt)

	func getUrl() -> String {
		switch self {
		case .fetchEnvironment:
			return "/api/environment"
		case .register:
			return "/api/auth/register"
		case .signIn:
			return "/api/auth/login"
		case .passwordReset:
			return "/api/auth/request-password-reset"
		case .resendEmailVerification:
			return "/api/auth/resend-email-verification"
		case .getUser:
			return "/api/user"
		case .getUserAccounts:
			return "/api/account"
		case .preSignedPhotoUploadUrl:
			return "/api/user/pre-signed-photo-upload-url"
		case .preSignedPhotoDownloadUrl:
			return "/api/user/pre-signed-photo-download-url"
		case .photoUploadStatus:
			return "/api/user/photo-upload-status"
		case .recipientOfFunds:
			return "/api/user/recipient-of-funds"
		case .patchAddress:
			return "/api/user/address"
		case .patchDisclosureOfFees:
			return "/api/user/disclosure-of-fees"
		case .patchOnBoardingFeedback:
			return "/api/user/on-boarding-feedback"
		case .getUserBalance:
			return "/api/user/balance"
		case .linkBankAccount:
			return "/api/account/link-bank-account"
		case .updateBankAccount(let id):
			return "/api/account/\(id)/update-bank-account"
		case .unlinkBankAccount(let id):
			return "/api/account/\(id)/unlink-bank-account"
		case .patchName:
			return "/api/user/name"
		case .legalDocsAcceptance:
			return "/api/user/legal-doc-acceptance"
		case .registerDevice:
			return "/api/user/register-device"
		case .searchUsers:
			return "/api/user/search"
		case .fetchRelationships(let id):
			return "/api/user/\(id)/relationships"
		case .searchVendors:
			return "/api/vendor/search"
		case .fetchPopularVendors:
			return "/api/vendor/popular"
		case .permanentlyDeleteAccount(let id):
			return "/api/user/\(id)"
		case .createVendorFromGooglePlace:
			return "/api/vendor/from-google-places"
		case .createMerchantExpense:
			return "/api/expense/shared-bill"
		case .createRecurringExpense:
			return "/api/expense/recurring-payment"
		case .fetchSharedExpenses(let id):
			return "/api/expense/user/" + String(id)
		case .fetchTransactions(let id):
			return "/api/expense/user/transactions/" + String(id)
		case .patchExpenseAgreement:
			return "/api/expense/agreement"
		case .cancelAgreement(let id):
			return "/api/expense/deactivate/" + String(id)
		}
	}
}
