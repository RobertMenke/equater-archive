//
//  NavBarHeader.swift
//  Equater
//
//  Created by Robert B. Menke on 5/7/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct NavBarHeader: View {
	@Binding var isShown: Bool
	var title: String

	let icon: Image = AppImage.drawer.image

	var body: some View {
		VStack {
			HStack(alignment: .bottom) {
				// Hamburger icon
				icon
					.resizable()
					.frame(minWidth: 0, maxWidth: 36, minHeight: 0, maxHeight: 36)
					.padding(.leading, 16)
					.colorMultiply(AppColor.textPrimary.color)
					.offset(y: 5)
					.onTapGesture {
						HapticEngine.shared.play(.buttonTap)
						self.isShown = !self.isShown
						// Dismiss keyboard when view is shown
						if self.isShown {
							UIApplication.shared.endEditing()
						}
					}

				// Nav title
				AppText(title, font: .title)
					.padding(.leading, 10)
			}
			.frameFillParent(alignment: .bottomLeading)
			Divider().foregroundColor(AppColor.textPrimary.color)
		}
		.frameFillParent()
	}
}

struct NavBarHeader_Previews: PreviewProvider {
	static var previews: some View {
		NavBarHeader(isShown: .constant(false), title: "Nav Header Preview")
	}
}
