//
//  ActionSheetPreview.swift
//  Equater
//
//  Created by Robert B. Menke on 5/2/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct ActionSheetPreview: View {
	@State private var isShown = false

	var body: some View {
		VStack {
			ContainedButton(
				label: "Action Sheet",
				enabled: true,
				size: .large,
				isLoading: .constant(false)
			) {
				HapticEngine.shared.play(.buttonTap)
				self.isShown = !self.isShown
			}
		}
		.withSheet(visible: $isShown, sheetContent: {
			MenuItem(icon: .shoppingBagIcon, text: "Stuff") {
				HapticEngine.shared.play(.buttonTap)
				self.isShown = false
			}

			MenuItem(icon: .shoppingBagIcon, text: "Things") {
				HapticEngine.shared.play(.buttonTap)
				self.isShown = false
			}

			MenuItem(icon: .closeIconColorFilled, text: "Close") {
				HapticEngine.shared.play(.buttonTap)
				self.isShown = false
			}
		})
	}
}

struct ActionSheetPreview_Previews: PreviewProvider {
	static var previews: some View {
		ActionSheetPreview()
	}
}
