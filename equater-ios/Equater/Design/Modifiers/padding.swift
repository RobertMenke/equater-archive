//
//  padding.swift
//  Equater
//
//  Created by Robert B. Menke on 5/12/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

enum Padding {
	case small
	case medium
	case large
}

private struct PaddingModifier: ViewModifier {
	var edgeSet: Edge.Set = .all
	var size: Padding

	func body(content: Content) -> some View {
		content.padding(edgeSet, getSize())
	}

	func getSize() -> CGFloat {
		switch size {
		case .small:
			return 2
		case .medium:
			return 8
		case .large:
			return 16
		}
	}
}

/// See: https://developer.apple.com/documentation/swift/optionset
extension View {
	func padding(_ size: Padding, _ set: Edge.Set = .all) -> some View {
		modifier(PaddingModifier(edgeSet: set, size: size))
	}
}
