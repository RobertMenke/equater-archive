//
//  AppImage.swift
//  Equater
//
//  Created by Robert B. Menke on 5/2/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI
import UIKit

enum AppImage: String, CaseIterable {
	/// Covered by test case ensuring force unwrap doesn't crash
	var uiImage: UIImage {
		UIImage(named: rawValue)!
	}

	var image: Image {
		Image(uiImage: uiImage)
	}

	func getUiImage(withColor color: AppColor) -> UIImage {
		let image = uiImage.withRenderingMode(.alwaysTemplate)

		return image.withTintColor(color.uiColor)
	}

	case defaultProfileImage = "account_icon"
	case shoppingBagIcon = "shopping_bag_object"
	case closeIconColorFilled = "close-color-filled"
	case drawer
	case menu
	case editIcon = "edit-icon"
	case fontIcon = "font-icon"
	case listIcon = "list-icon"
	case tapIcon = "tap-icon"
	case notificationIcon = "notification-icon"
	case centerAlignIcon = "center-alignment-icon"
	case avatarIcon = "avatar-icon"
	case plusIcon = "plus-icon"
	case add18pt = "add-18pt"
	case add24pt = "add-24pt"
	case cameraIcon = "camera-icon"
	case photoIcon = "photo-icon"
	case wallet
	case createSharedExpense = "create-shared-expense"
	case manageSharedExpense = "manage-shared-expense"
	case friends
	case callSupport = "call-support"
	case info
	case signOut = "sign-out"
	case privacy
	case profile
	case payment
	case teamwork
	case forwardFilled = "forward-filled"
	case forwardFilledWhite = "forward-filled-white"
	case clock
	case store
	case noSearchResults = "no_search_results"
	case addMail = "add-mail"
	case emailSent = "email_sent"
	case walletIcon = "wallet-icon"
	case arrowDropDown = "arrow-drop-down"
	case clockIcon = "clock-icon"
	case clockIconClipped = "clock-icon-clipped"
	case calendar
	case keyboardArrowRight = "keyboard-arrow-right"
	case notFound = "not-found"
	case weightScale = "weight-scale"
	case create
	case list
	case write
	case creditCard = "credit-card"
	case verificationCheck = "verification-check"
	case mailbox
	case call
	case chat
	case bell
	case holdingPhone = "holding-phone"
	case chevronRightDouble = "chevron-right-double"
	case simpleCheckMark = "simple-check-mark"
	case moneyTransfer = "money-transfer"
	case cardSuccess = "card-success"
	case financeChart = "finance-chart"
	case teamworkPurple = "teamwork-purple"
	case creditCard3d = "credit-card-3d"
	case mapPin = "map-pin"
	case poweredByGoogle = "powered-by-google"
	case netflixLogoTransparent = "netflix-logo-transparent"
	case dukeEnergyLogoTransparent = "duke-energy-logo-transparent"
	case targetLogoTransaprent = "target-logo-transparent"
	case spotifyLogoTransaprent = "spotify-logo-transparent"
	case question
	case walletGray = "wallet-icon-gray"
	case userCancel = "user-cancel"
	case settings
	case heartbeat
}
