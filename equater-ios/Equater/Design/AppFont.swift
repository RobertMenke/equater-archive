//
//  AppFont.swift
//  Equater
//
//  Created by Robert B. Menke on 4/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

enum AppFont: Equatable {
	/// Intended for very large titles
	case jumbo

	/// Intended for titles of a screen
	case title

	/// Intended for subtitles of a screen
	case subtitle

	/// Intended to be the primary text in a component like a table row or a card
	case primaryText

	/// Intended to be the subtext in a component like a table row or a card
	case subText

	/// Small buttons that should only contain 1 short word
	case buttonSmall

	/// Medium buttons that typically contain 1 word but may contain 2 short words
	case buttonMedium

	/// Large buttons meant to have more flexibility in label character length
	case buttonLarge

	/// Intended for cases when none of the presets fit well
	case custom(size: CGFloat, color: AppColor)

	/// Standard set of fonts to be used app-wide
	func getFont() -> Font {
		switch self {
		case .jumbo:
			return .custom("Inter", size: 36.0)
		case .title:
			return .custom("Inter", size: 24.0)
		case .subtitle:
			return .custom("Inter", size: 18.0)
		case .primaryText:
			return .custom("Inter", size: 16.0)
		case .subText:
			return .custom("Inter", size: 12.0)
		case .buttonLarge:
			return .custom("Inter", size: 14.0)
		case .buttonMedium:
			return .custom("Inter", size: 12.0)
		case .buttonSmall:
			return .custom("Inter", size: 10.0)
		case .custom(let size, _):
			return .custom("Inter", size: size)
		}
	}

	/// For interop with UIKit
	func getUIFont() -> UIFont {
		switch self {
		case .jumbo:
			return makeUIFont(size: 36.0)
		case .title:
			return makeUIFont(size: 24.0)
		case .subtitle:
			return makeUIFont(size: 18.0)
		case .primaryText:
			return makeUIFont(size: 16.0)
		case .subText:
			return makeUIFont(size: 12.0)
		case .buttonLarge:
			return makeUIFont(size: 15.0)
		case .buttonMedium:
			return makeUIFont(size: 13.0)
		case .buttonSmall:
			return makeUIFont(size: 11.0)
		case .custom(let size, _):
			return makeUIFont(size: size)
		}
	}

	private func makeUIFont(size: CGFloat) -> UIFont {
		UIFont(name: "Inter", size: size) ?? UIFont.systemFont(ofSize: size)
	}

	/// Standard set of text colors to be used app-wide
	func getColor() -> Color {
		switch self {
		case .jumbo, .title, .primaryText:
			return AppColor.textPrimary.color
		case .subtitle, .subText:
			return AppColor.textSecondary.color
		/// Button text color is handled by the material theme (see globalMaterialTheme)
		case .buttonSmall, .buttonMedium, .buttonLarge:
			return AppColor.accentPrimaryForText.color
		case .custom(_, let color):
			return color.color
		}
	}
}
