//
//  ListHeader.swift
//  Equater
//
//  Created by Robert B. Menke on 8/9/22.
//  Copyright © 2022 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct ListHeader: View {
	var text: String
	var backgroundColor = AppColor.backgroundSecondary
	var textColor = AppColor.textSecondary
	var height: CGFloat = 28.0

	var body: some View {
		HStack(alignment: .center) {
			AppText(text, font: .custom(size: 11.0, color: textColor))
				.padding(.leading, 14)
		}
		.frame(
			minWidth: 0,
			maxWidth: .infinity,
			minHeight: height,
			maxHeight: height,
			alignment: .leading
		)
		.background(backgroundColor.color)
	}
}

struct ListHeader_Previews: PreviewProvider {
	static var previews: some View {
		ListHeader(text: "FOO BAR")
	}
}
