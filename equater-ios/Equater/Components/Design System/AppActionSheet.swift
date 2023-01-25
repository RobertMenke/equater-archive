//
//  AppActionSheet.swift
//  Equater
//
//  Created by Robert B. Menke on 5/2/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

// MARK: - ViewModifier Implementation

struct SheetModifier<SheetContent: View>: ViewModifier {
	@Binding var visible: Bool
	var sheetContent: () -> SheetContent

	/// The strategy here is to use 3 views within a ZStack
	/// When the action sheet is visible, the action sheet is on top
	/// When the action sheet is visible, the overlay will sit behind the action sheet but above the window content
	/// When the action sheet is visible, clicking on the overlay will dismiss the action sheet
	func body(content: Content) -> some View {
		ZStack {
			AppActionSheet(visible: $visible, content: sheetContent).zIndex(3)
			Overlay(visible: $visible).zIndex(self.visible ? 2 : 0)
			content.zIndex(1)
		}
	}
}

// MARK: - Action Sheet Implementation

struct AppActionSheet<Content: View>: View {
	@Binding var visible: Bool
	var content: () -> Content

	@State private var offset: CGFloat = UIScreen.main.bounds.height
	@State private var dragOffset: CGFloat = 0.0
	private var bottomSafeAreaHeight = UIApplication.shared.windows.last?.safeAreaInsets.bottom ?? 0

	init(visible: Binding<Bool>, @ViewBuilder content: @escaping () -> Content) {
		_visible = visible
		self.content = content
	}

	/// Note the use of Spacer() here in order to push the action sheet to the bottom of the screen
	var body: some View {
		VStack {
			Spacer()
			VStack {
				Knotch
				SheetContent
			}
			.offset(y: visible ? dragOffset : offset)
			.animation(.spring())
			.gesture(
				DragGesture()
					.onChanged { gesture in
						self.dragOffset = max(0, gesture.translation.height)
					}
					.onEnded { _ in
						withAnimation(.spring()) {
							if self.dragOffset > 100 {
								self.visible = false
								self.dragOffset = 0
							} else {
								self.dragOffset = 0
							}
						}
					}
			)
		}
		.frameFillParent()
		.edgesIgnoringSafeArea(.all)
	}

	/// This knotch is a rounded rectangle that's purely a visual indicator that the action sheet can be dragged
	/// Note that the frame is 80 px tall in order to provide extra room for error in the DragGesture
	var Knotch: some View {
		HStack(alignment: .bottom) {
			RoundedRectangle(cornerRadius: 8.0, style: .circular)
				.frame(width: 64.0, height: 4.0, alignment: .center)
				.background(AppColor.textPrimary.color)
				.cornerRadius(8.0)
				.padding(.bottom, 4)
		}
		.frame(minWidth: 0, maxWidth: .infinity, minHeight: 0, maxHeight: 80, alignment: .bottom)
	}

	/// This is the vstack that contains any custom content inside of the action sheet
	var SheetContent: some View {
		VStack(alignment: .leading, spacing: 0.0, content: self.content)
			.padding(.bottom, bottomSafeAreaHeight + 10)
			.padding(.top, 20)
			.background(AppColor.backgroundPrimary.color)
			.cornerRadius(8)
			.edgesIgnoringSafeArea(.bottom)
	}
}

// MARK: - View Extension

extension View {
	func withSheet<SheetContent: View>(
		visible: Binding<Bool>,
		@ViewBuilder sheetContent: @escaping () -> SheetContent
	) -> some View {
		modifier(SheetModifier(visible: visible, sheetContent: sheetContent))
	}
}

struct AppActionSheet_Previews: PreviewProvider {
	static var previews: some View {
		AppActionSheet(visible: .constant(true)) {
			MenuItem(icon: .shoppingBagIcon, text: "Stuff") {
				print("stuff tapped")
			}
			MenuItem(icon: .shoppingBagIcon, text: "Things") {
				print("things tapped")
			}
			MenuItem(icon: .closeIconColorFilled, text: "Cancel") {
				print("Cancel tapped")
			}
		}
	}
}
