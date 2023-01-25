//
//  frames.swift
//  Equater
//
//  Created by Robert B. Menke on 4/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct FrameFill: ViewModifier {
	var alignment = Alignment.topLeading
	func body(content: Content) -> some View {
		content.frame(
			minWidth: 0,
			maxWidth: .infinity,
			minHeight: 0,
			maxHeight: .infinity,
			alignment: alignment
		)
	}
}

struct FrameFillWidth: ViewModifier {
	let height: CGFloat?
	var alignment = Alignment.topLeading

	func body(content: Content) -> some View {
		content.frame(
			minWidth: 0,
			maxWidth: .infinity,
			minHeight: 0,
			maxHeight: height,
			alignment: alignment
		)
	}
}

struct FrameFillHeight: ViewModifier {
	let width: CGFloat?
	var alignment = Alignment.topLeading

	func body(content: Content) -> some View {
		content.frame(
			minWidth: 0,
			maxWidth: width,
			minHeight: 0,
			maxHeight: .infinity,
			alignment: alignment
		)
	}
}

extension View {
	func frameFillParent(alignment: Alignment = .topLeading) -> some View {
		modifier(FrameFill(alignment: alignment))
	}

	func frameFillWidth(height: CGFloat?, alignment: Alignment = .topLeading) -> some View {
		modifier(FrameFillWidth(height: height, alignment: alignment))
	}

	func frameFillHeight(width: CGFloat?, alignment: Alignment = .topLeading) -> some View {
		modifier(FrameFillHeight(width: width, alignment: alignment))
	}
}
