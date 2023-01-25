//
//  NavDrawerPreview.swift
//  Equater
//
//  Created by Robert B. Menke on 5/6/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct NavDrawerPreview: View {
	let icon: Image = AppImage.drawer.image
	@State var isShown = false

	var body: some View {
		HeaderWithContentLayout(
			header: VStack(alignment: .leading, spacing: 20.0) {
				HStack(alignment: .center) {
					icon
						.resizable()
						.frame(minWidth: 0, maxWidth: 36, minHeight: 0, maxHeight: 36)
						.padding(.leading, 25)
						.colorMultiply(AppColor.textPrimary.color)
						.onTapGesture {
							self.isShown = !self.isShown
						}
				}
				Divider().foregroundColor(AppColor.textPrimary.color)
			},
			content: Text("Content goes here")
		)
		.withNavDrawer(visible: self.$isShown, navContent: {
			NavDrawerLayout(user: userFake, menuItems: [
				MenuItem(icon: .shoppingBagIcon, text: "Stuff") {
					print("Tapped stuff")
				},
				MenuItem(icon: .shoppingBagIcon, text: "Things") {
					print("Tapped things")
				},
				MenuItem(icon: .shoppingBagIcon, text: "Longer menu item") {
					print("Tapped Foo")
				},
			])
		})
	}
}

struct NavDrawerPreview_Previews: PreviewProvider {
	static var previews: some View {
		NavDrawerPreview()
	}
}
