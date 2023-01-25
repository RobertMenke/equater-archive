//
//  shadwos.swift
//  Equater
//
//  Created by Robert B. Menke on 4/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct ShadowSmall: ViewModifier {
	func body(content: Content) -> some View {
		content.shadow(
			color: AppColor.shadow.color.opacity(0.3),
			radius: 2.0,
			x: 0.0,
			y: 0.0
		)
	}
}

/// Since shadow used in conjunction with padding the steps up in shadow will be just under their padding
struct ShadowMedium: ViewModifier {
	func body(content: Content) -> some View {
		content.shadow(color: AppColor.shadow.color.opacity(0.3), radius: 6.0)
	}
}

struct ShadowLarge: ViewModifier {
	func body(content: Content) -> some View {
		content.shadow(
			color: AppColor.shadow.color.opacity(0.3),
			radius: 6.0,
			x: 0.0,
			y: 0.0
		)
	}
}

extension View {
	func shadowSmall() -> some View {
		modifier(ShadowSmall())
	}

	func shadowMedium() -> some View {
		modifier(ShadowMedium())
	}

	func shadowLarge() -> some View {
		modifier(ShadowLarge())
	}
}
