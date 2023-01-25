//
//  TitleDivider.swift
//  Equater
//
//  Created by Robert B. Menke on 2/16/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct TitleDivider: View {
	let title: String

	var body: some View {
		HStack {
			VStack {
				Divider()
			}

			AppText(title, font: .primaryText)
				.padding(EdgeInsets(top: 0, leading: 10, bottom: 0, trailing: 10))

			VStack {
				Divider()
			}
		}
	}
}

struct TitleDivider_Previews: PreviewProvider {
	static var previews: some View {
		TitleDivider(title: "Foo")
	}
}
