//
//  effects.swift
//  Equater
//
//  Created by Robert B. Menke on 5/2/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI
import UIKit

extension View {
	func hapticFeedbackOnTap(style: UIImpactFeedbackGenerator.FeedbackStyle = .light) -> some View {
		onTapGesture {
			HapticEngine.shared.play(.buttonTap)
		}
	}

	func visualEffect(effect: UIVisualEffect, cornerRadius: CGFloat = 0.0) -> some View {
		background(VisualEffectView(effect: effect, cornerRadius: cornerRadius))
	}

	func animatedCircleBackground(
		color: Color,
		circleSize: CGFloat,
		startingStrokeWidth start: CGFloat,
		endingStrokeWidth end: CGFloat,
		isAnimating: Binding<Bool>
	) -> some View {
		modifier(
			AnimatedCircle(
				circleSize: circleSize,
				startingStrokeWidth: start,
				endingStrokeWidth: end,
				color: color,
				isAnimating: isAnimating
			)
		)
	}
}

struct AnimatedCircle: ViewModifier {
	@State private var isAtEnd = false
	var circleSize: CGFloat
	var startingStrokeWidth: CGFloat
	var endingStrokeWidth: CGFloat
	var color: Color
	@Binding var isAnimating: Bool

	func body(content: Content) -> some View {
		let value = isAtEnd ? endingStrokeWidth : startingStrokeWidth

		return content
			.background(CircleBackground(borderColor: color, strokeWidth: value).frame(width: circleSize, height: circleSize))
			.onAppear {
				animate()
			}
	}

	func animate() {
		if isAnimating {
			withAnimation(.easeInOut(duration: 1.0)) {
				isAtEnd = !isAtEnd
			}
		} else {
			withAnimation(.easeInOut(duration: 1.0)) {
				isAtEnd = false
			}
		}

		DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
			animate()
		}
	}
}
