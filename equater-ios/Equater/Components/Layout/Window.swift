//
//  Window.swift
//  Equater
//
//  Created by Robert B. Menke on 4/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct Window<Content: View>: View {
	var content: () -> Content

	init(@ViewBuilder content: @escaping () -> Content) {
		self.content = content
	}

	/// The outer vstack covers the safe area and the inner vstack adds padding around the content
	/// so that it doesn't look out of place
	var body: some View {
		VStack {
			VStack(content: self.content).frameFillParent()
		}
		.frameFillParent()
		.background(AppColor.backgroundPrimary.color)
		.edgesIgnoringSafeArea(.all)
	}
}

struct Background_Previews: PreviewProvider {
	static var previews: some View {
		Window {
			AppText("Something", font: .title)
		}
	}
}
