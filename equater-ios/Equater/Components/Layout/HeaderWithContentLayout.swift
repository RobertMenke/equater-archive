//
//  HeaderWithContentLayout.swift
//  Equater
//
//  Created by Robert B. Menke on 1/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct HeaderWithContentLayout<Header: View, Content: View>: View {
	var headerHeight: CGFloat = 60
	var header: Header
	var content: Content

	var body: some View {
		VStack(spacing: 0) {
			HStack {
				header
			}
			.frameFillWidth(height: self.headerHeight)

			HStack {
				content
			}
			.frameFillParent()
		}
		.frameFillParent()
	}
}

struct HeaderWithContentLayout_Previews: PreviewProvider {
	static var previews: some View {
		HeaderWithContentLayout(
			header: Text("Hello"),
			content: Text("World")
		)
	}
}
