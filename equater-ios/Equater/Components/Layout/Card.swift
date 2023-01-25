//
//  Card.swift
//  Equater
//
//  Created by Robert B. Menke on 4/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct Card<Content: View>: View {
	var backgroundColor = AppColor.backgroundSecondary
	var content: () -> Content
	@State private var shadow: CGFloat = 5.0

	init(backgroundColor: AppColor = AppColor.backgroundSecondary, @ViewBuilder content: @escaping () -> Content) {
		self.content = content
	}

	var body: some View {
		HStack(alignment: .center, content: self.content)
			.frame(
				minWidth: 0,
				maxWidth: .infinity,
				minHeight: 70,
				maxHeight: nil,
				alignment: Alignment.leading
			)
			.padding(EdgeInsets(top: 10, leading: 16, bottom: 10, trailing: 16))
			.foregroundColor(.secondary)
			.background(backgroundColor.color)
			.cornerRadius(8.0)
			.shadowSmall()
	}
}

struct Card_Previews: PreviewProvider {
	static var previews: some View {
		Card {
			VStack(alignment: .leading) {
				AppText("\(userFake.firstName) \(userFake.lastName)", font: .primaryText)

				AppText("\(userFake.email)", font: .subText)
			}
		}
	}
}
