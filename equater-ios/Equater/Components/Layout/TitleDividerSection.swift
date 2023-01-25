//
//  TitleDividerSection.swift
//  Equater
//
//  Created by Robert B. Menke on 2/16/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct TitleDividerSection<Component: View>: View {
	let title: String
	let component: Component

	var body: some View {
		VStack(spacing: 0) {
			TitleDivider(title: title)
			component
			Divider()
		}
	}
}

struct TitleDividerSection_Previews: PreviewProvider {
	static var previews: some View {
		TitleDividerSection(
			title: "Epic Title",
			component: ScrollView(.horizontal) {
				HStack(spacing: 20) {
					SelectedUserCard(user: userFake, onRemovalRequested: { user in
						print("\(user.firstName)")
					})
				}
				.frame(height: 85.0)
				.padding(EdgeInsets(top: 0.0, leading: 20.0, bottom: 0.0, trailing: 20.0))
			}
		)
	}
}
