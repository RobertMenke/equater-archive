//
//  AppIcon.swift
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

	case defaultProfileImage = "account_icon"
	case shoppingBagIcon = "shopping_bag_object"
	case closeIconColorFilled = "close-color-filled"
}
