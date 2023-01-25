//
//  SharedExpenseTypeSelection.swift
//  Equater
//
//  Created by Robert B. Menke on 5/25/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct SharedExpenseTypeSelection<GradientBackground: View>: View {
	let gradient: GradientBackground
	let title: String
	let subtitle: String
	let image: AppImage

	var body: some View {
		GradientCard(gradient: gradient) {
			ZStack {
				self.Image
				self.Description
				self.DirectionIndicator
			}
		}
	}

	var Description: some View {
		VStack(alignment: .leading, spacing: 2) {
			Text(self.title)
				.font(.custom("Inter", size: 22.0))
				.foregroundColor(.white)
				.bold()
				.shadow(color: .black, radius: 4, x: 0, y: 1)

			Text(self.subtitle)
				.font(.custom("Inter", size: 16.0))
				.foregroundColor(.white)
				.fontWeight(.medium)
				.lineSpacing(2)
				.shadow(color: .black, radius: 4, x: 0, y: 3)
		}
		.frameFillParent()
		.padding(.top, 16)
		.padding([.leading, .trailing], 16)
	}

	var Image: some View {
		GeometryReader { geo in
			HStack(alignment: .bottom) {
				self.image
					.image
					.resizable()
					.opacity(0.65)
					.aspectRatio(contentMode: .fit)
					.frame(
						width: geo.size.width / 2,
						height: geo.size.height,
						alignment: .bottomLeading
					)
					.offset(x: 16, y: -10)
			}
			.frameFillParent(alignment: .bottomLeading)
		}
	}

	var DirectionIndicator: some View {
		HStack(alignment: .bottom) {
			AppImage
				.forwardFilledWhite
				.image
				.resizable()
				.aspectRatio(contentMode: .fit)
				.frame(minWidth: 0, maxWidth: 40, minHeight: 0, maxHeight: 40, alignment: .bottomTrailing)
				.padding([.trailing, .bottom], 16)
		}
		.frameFillParent(alignment: .bottomTrailing)
	}
}

struct SharedExpenseTypeSelection_Previews: PreviewProvider {
	static var previews: some View {
		GeometryReader { (geo: GeometryProxy) in
			VStack(spacing: 80) {
				Spacer()

				SharedExpenseTypeSelection(
					gradient: LinearGradient(
						gradient: Gradient(colors: [
							Color(red: 121 / 255, green: 26 / 255, blue: 203 / 255),
							Color(red: 185 / 255, green: 23 / 255, blue: 148 / 255),
						]),
						startPoint: UnitPoint(x: 0.5, y: 0.5),
						endPoint: UnitPoint(x: 1.0, y: 1.0)
					),
					title: "Split the Cost of a Merchant",
					subtitle: "When a merchant like Spotify charges you, Equater handles splitting up the cost with your friends automatically",
					image: .payment
				)
				.frameFillWidth(height: geo.size.height / 2 - 32)

				SharedExpenseTypeSelection(
					gradient: LinearGradient(
						gradient: Gradient(colors: [
							Color(red: 121 / 255, green: 26 / 255, blue: 203 / 255),
							Color(red: 185 / 255, green: 23 / 255, blue: 148 / 255),
						]),
						startPoint: UnitPoint(x: 0.5, y: 0.5),
						endPoint: UnitPoint(x: 1.0, y: 1.0)
					),
					title: "Set Up a Recurring Payment",
					subtitle: "Create a recurring payment like rent between yourself and one or more people",
					image: .teamwork
				)
				.frameFillWidth(height: geo.size.height / 2 - 32)

				Spacer()
			}
			.frameFillParent()
			.padding([.leading, .trailing], 16)
		}
	}
}
