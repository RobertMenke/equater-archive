//
//  View.swift
//  Equater
//
//  Created by Robert B. Menke on 5/31/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

/// Elegant solution! https://stackoverflow.com/a/58606176/4313362
struct RoundedCorner: Shape {
	var radius: CGFloat = .infinity
	var corners: UIRectCorner = .allCorners

	func path(in rect: CGRect) -> Path {
		let path = UIBezierPath(roundedRect: rect, byRoundingCorners: corners, cornerRadii: CGSize(width: radius, height: radius))

		return Path(path.cgPath)
	}
}

extension View {
	func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
		clipShape(RoundedCorner(radius: radius, corners: corners))
	}
}
