
//
//  Select.swift
//  Equater
//
//  Created by Robert B. Menke on 6/21/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

/// Tap gesture intentionally left to the caller because the frame is also intentionally the responsibility
/// of the caller
struct Select: View {
	var selection: String

	var body: some View {
		HStack(alignment: .center) {
			ZStack {
				HStack(alignment: .center) {
					Spacer()
					AppImage.arrowDropDown.image.colorMultiply(AppColor.textPrimary.color).padding(.trailing, 5)
				}
				.frameFillParent(alignment: .center)

				HStack(alignment: .center) {
					Spacer()
					AppText(self.selection, font: .primaryText)
					Spacer()
				}
				.frameFillParent(alignment: .center)
			}
		}
		.overlay(RoundedRectangle(cornerRadius: 4).stroke(AppColor.backgroundSecondary.color, lineWidth: 1))
	}
}

struct Select_Previews: PreviewProvider {
	static var previews: some View {
		Select(selection: "Foo")
	}
}
