//
//  Row.swift
//  Equater
//
//  Created by Robert B. Menke on 8/9/22.
//  Copyright © 2022 beauchampsullivan. All rights reserved.
//

import SwiftUI

// TODO: This probably isn't generic enough to warrant the name "Row". Consider renaming to SettingsRow.
struct Row<Content: View>: View {
	var height: CGFloat
	var onTap: (() -> Void)?
	var content: () -> Content
	@GestureState private var isDetectingLongPress = false
	@State private var isPressed = false

	init(height: CGFloat = 70, onTap: (() -> Void)? = nil, @ViewBuilder content: @escaping () -> Content) {
		self.height = height
		self.onTap = onTap
		self.content = content
	}

	var body: some View {
		HStack(alignment: .center, content: self.content)
			.frame(
				minWidth: 0,
				maxWidth: .infinity,
				minHeight: height,
				maxHeight: nil,
				alignment: Alignment.leading
			)
			.contentShape(Rectangle())
			.padding([.leading, .trailing], 24)
			.background(isDetectingLongPress ? AppColor.backgroundSecondary.color : AppColor.backgroundPrimary.color)
			.gesture(
				LongPressGesture(minimumDuration: .infinity, maximumDistance: .infinity)
					.updating($isDetectingLongPress) { currentState, gestureState, _ in
						gestureState = currentState
					}
			)
			.simultaneousGesture(TapGesture().onEnded {
				HapticEngine.shared.play(.buttonTap)
				self.onTap?()
			})
			.animation(.easeIn(duration: 0.2), value: isDetectingLongPress)
	}
}

struct Row_Previews: PreviewProvider {
	static var previews: some View {
		Row {
			EmptyView()
		}
	}
}
