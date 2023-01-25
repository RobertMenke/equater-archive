//
//  GradientCard.swift
//  Equater
//
//  Created by Robert B. Menke on 5/25/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

/// Should only be used for content you want to be bold/striking
struct GradientCard<GradientBackground: View, Content: View>: View {
	let gradient: GradientBackground
	var content: () -> Content

	init(gradient: GradientBackground, @ViewBuilder _ content: @escaping () -> Content) {
		self.gradient = gradient
		self.content = content
	}

	var body: some View {
		VStack(content: self.content)
			.frameFillParent()
			.background(gradient)
			.cornerRadius(8)
			.shadowLarge()
	}
}

struct GradientCard_Previews: PreviewProvider {
	static let gradient = LinearGradient(
		gradient: Gradient(colors: [
			Color(red: 121 / 255, green: 26 / 255, blue: 203 / 255),
			Color(red: 185 / 255, green: 23 / 255, blue: 148 / 255),
		]),
		startPoint: UnitPoint(x: 0.5, y: 0.5),
		endPoint: UnitPoint(x: 1.0, y: 1.0)
	)
	static var previews: some View {
		Window {
			Spacer()
			VStack(alignment: .center) {
				GradientCard(gradient: gradient) {
					Text("Hello")
				}
			}
			.frameFillWidth(height: 400)
			.padding([.leading, .trailing], 16)
			Spacer()
		}
	}
}
