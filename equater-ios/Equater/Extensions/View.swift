//
//  View.swift
//  Equater
//
//  Created by Robert B. Menke on 1/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

extension View {
	func resignKeyboardOnDragGesture() -> some View {
		modifier(ResignKeyboardOnDragGesture())
	}

	var typeErased: AnyView { AnyView(self) }

	public func gradientForeground(colors: [Color]) -> some View {
		let gradient = LinearGradient(
			colors: colors,
			startPoint: .topLeading,
			endPoint: .bottomTrailing
		)

		return overlay(gradient).mask(self)
	}

	func animatableGradient(fromGradient: Gradient, toGradient: Gradient, progress: CGFloat) -> some View {
		modifier(AnimatableGradientModifier(fromGradient: fromGradient, toGradient: toGradient, progress: progress))
	}

	func animatableForegroundGradient(fromGradient: Gradient, toGradient: Gradient, progress: CGFloat) -> some View {
		let gradientModifier = modifier(AnimatableGradientModifier(fromGradient: fromGradient, toGradient: toGradient, progress: progress))

		return overlay(gradientModifier).mask(self)
	}
}
