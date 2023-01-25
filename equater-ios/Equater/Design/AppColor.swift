//
//  Color.swift
//  Equater
//
//  Created by Robert B. Menke on 4/25/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation
import SwiftUI

/// All colors correspond to their xcasset color set values
enum AppColor: String, CaseIterable {
	var color: Color {
		Color(uiColor)
	}

	/// Test case iterates over every case and ensures no color
	/// causes a crash
	var uiColor: UIColor {
		UIColor(named: rawValue)!
	}

	case backgroundPrimary = "background-primary"
	case backgroundSecondary = "background-secondary"
	case inverseBackgroundPrimary = "inverse-background-primary"
	case inverseBackgroundSecondary = "inverse-background-secondary"
	case accentPrimary = "accent-primary"
	case accentPrimaryForText = "accent-primary-for-text"
	case accentDark = "accent-dark"
	case accentLight = "accent-light"
	case accentMedium = "accent-medium"
	case accentHighContrast = "accent-high-contrast"
	case textPrimary = "text-primary"
	case textSecondary = "text-secondary"
	case textLight = "text-light"
	case textDark = "text-dark"
	case shadow
	case boldBlue = "bold-blue"
	case topLeadingLightBlueGradient = "top-leading-light-blue-gradient"
	case topLeadingLightPurpleGradient = "top-leading-light-purple-gradient"
	case white
	case greenAccept = "green-accept"
	case redDecline = "red-decline"
	case lightGreenAccept = "light-green-accept"
	case lightRedDecline = "light-red-decline"
	case darkPurpleGradient = "dark-purple-gradient"
	case darkBlueGradient = "dark-blue-gradient"
	case redSwipeToCancelLight = "red-swipe-to-cancel-light"
	case royalBlueLight = "royal-blue-light"
	case maximumContrast = "maximum-contrast"
}
