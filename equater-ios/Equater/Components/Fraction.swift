//
//  Fraction.swift
//  Equater
//
//  Created by Robert B. Menke on 2/14/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct Fraction: View {
	let numerator: String
	let denominator: String
	let font: AppFont = .primaryText
	var height: CGFloat = 32
	var lineWidth: CGFloat = 20

	var body: some View {
		VStack(alignment: .center, spacing: 1) {
			Spacer()
			AppText(numerator, font: font)
			RoundedRectangle(cornerRadius: 1)
				.fill(font.getColor())
				.frame(width: lineWidth, height: 2)
			AppText(denominator, font: font)
			Spacer()
		}
		.frame(height: height)
	}
}

struct Fraction_Previews: PreviewProvider {
	static var previews: some View {
		Fraction(numerator: "1", denominator: "3")
	}
}
