//
//  AppText.swift
//  Equater
//
//  Created by Robert B. Menke on 4/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct AppText: View {
	let content: String
	let font: AppFont

	init(_ text: String, font: AppFont) {
		content = text
		self.font = font
	}

	var body: Text {
		var text = Text(content)
			.font(font.getFont())
			.foregroundColor(font.getColor())

		if font == .primaryText || font == .title || font == .jumbo {
			text = text.bold()
		}

		return text
	}

	func bold() -> Text {
		body.bold()
	}

	func fontWeight(_ fontWeight: Font.Weight) -> Text {
		body.fontWeight(fontWeight)
	}
}
