//
//  Transition.swift
//  Equater
//
//  Created by Robert B. Menke on 1/9/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import Foundation
import SwiftUI

extension AnyTransition {
	static var moveAndFade: AnyTransition {
		let insertion = AnyTransition
			.move(edge: .trailing)
			.combined(with: .opacity)

		let removal = AnyTransition
			.scale
			.combined(with: .opacity)

		return .asymmetric(insertion: insertion, removal: removal)
	}

	static var slideIn: AnyTransition {
		let insertion = AnyTransition
			.move(edge: .trailing)
			.combined(with: .opacity)

		let removal = AnyTransition
			.move(edge: .leading)
			.combined(with: .opacity)

		return .asymmetric(insertion: insertion, removal: removal)
	}

	static var pivot: AnyTransition {
		let insertion = AnyTransition
			.modifier(
				active: CornerRotateModifier(amount: -90, anchor: .center),
				identity: CornerRotateModifier(amount: 0, anchor: .center)
			)
			.combined(with: .opacity)

		let removal = AnyTransition
			.modifier(
				active: CornerRotateModifier(amount: 90, anchor: .center),
				identity: CornerRotateModifier(amount: 0, anchor: .center)
			)
			.combined(with: .opacity)

		return .asymmetric(insertion: insertion, removal: removal)
	}
}

struct CornerRotateModifier: ViewModifier {
	let amount: Double
	let anchor: UnitPoint

	func body(content: Content) -> some View {
		content.rotationEffect(.degrees(amount), anchor: anchor).clipped()
	}
}
