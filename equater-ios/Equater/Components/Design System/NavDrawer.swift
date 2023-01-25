//
//  NavDrawer.swift
//  Equater
//
//  Created by Robert B. Menke on 5/5/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct NavModifier<NavContent: View>: ViewModifier {
	@Binding var visible: Bool
	var navContent: () -> NavContent

	/// When visible, the nav drawer is on top, followed by the overlay, followed by the underlying content
	func body(content: Content) -> some View {
		ZStack(alignment: .topLeading) {
			NavDrawer(visible: $visible, content: self.navContent).zIndex(3)
			Overlay(visible: $visible).zIndex(self.visible ? 2 : 0)
			content.zIndex(1)
		}
	}
}

/// The wrapper for the nav bar content. Controls the dimensions of the nav bar, the background color,
/// and the basic layout (full height, 75% of width aligned on the leading edge of the screen)
struct NavDrawer<Content: View>: View {
	@Binding var visible: Bool
	var content: () -> Content

	@State private var offset: CGFloat = UIScreen.main.bounds.width * -1
	@State private var dragOffset: CGFloat = 0.0

	var body: some View {
		GeometryReader { (geo: GeometryProxy) in
			// Outer HStack encompasses full width of screen
			HStack {
				// Inner HStack contains the drawer and the knotch, all of which is draggable
				HStack(alignment: .center) {
					VStack(alignment: .leading, content: self.content)
						.frameFillParent()
						.background(AppColor.backgroundPrimary.color)
						// Prevents child elements from receiving the same shadow https://stackoverflow.com/a/56521130/4313362
						.clipped()
						.shadow(color: AppColor.shadow.color, radius: 4.0)
					self.Knotch
				}
				.frame(
					minWidth: 0,
					maxWidth: geo.size.width,
					minHeight: 0,
					maxHeight: .infinity,
					alignment: .leading
				)
				.offset(x: self.visible ? self.dragOffset : self.offset)
				.animation(.default)
				.gesture(
					DragGesture()
						.onChanged { gesture in
							self.dragOffset = min(0, gesture.translation.width)
						}
						.onEnded { _ in
							withAnimation(.spring()) {
								if abs(self.dragOffset) > geo.size.width / 4 {
									self.visible = false
									self.dragOffset = 0
								} else {
									self.dragOffset = 0
								}
							}
						}
				)
				// Spacer pushes content to the left and creates room for the overlay
				Spacer()
			}
			.edgesIgnoringSafeArea(.all)
		}
	}

	/// This knotch is a rounded rectangle that's purely a visual indicator that the action sheet can be dragged
	/// Note that the frame is 80 px tall in order to provide extra room for error in the DragGesture
	private var Knotch: some View {
		VStack(alignment: .leading) {
			RoundedRectangle(cornerRadius: 8.0, style: .circular)
				.frame(width: 4.0, height: 32.0, alignment: .center)
				.background(AppColor.textPrimary.color)
				.cornerRadius(8.0)
				.padding(.bottom, 4)
		}
		.frame(minWidth: 0, maxWidth: 80, minHeight: 0, maxHeight: .infinity, alignment: .leading)
	}
}

/// This should just be used as a default. Create custom layout for the nav drawer if need be.
struct NavDrawerLayout<Item: View>: View {
	@InjectedObject private var appState: AppState
	var user: User
	var menuItems: [Item]
	var onProfileTapped: (() -> Void)?
	@State private var profilePhoto: UIImage?

	var body: some View {
		GeometryReader { (geo: GeometryProxy) in
			VStack {
				self.makeProfileSection(geo)
				self.MenuItemSection
			}
		}
	}

	/// Top section containing a profile picture
	private func makeProfileSection(_ geo: GeometryProxy) -> some View {
		HStack(alignment: .bottom) {
			VStack(alignment: .center, spacing: 8) {
				ProfilePhotoAvatar(user: self.user, image: self.$appState.avatar, size: .custom(width: 100, height: 100))

				AppText("\(self.user.firstName) \(self.user.lastName)", font: .primaryText)
			}
			.frame(maxWidth: .infinity, alignment: .center)
			.offset(y: 10.0)
		}
		.edgesIgnoringSafeArea(.all)
		.frame(maxHeight: geo.size.height / 3.5, alignment: .center)
		.background(AppColor.backgroundSecondary.color)
		.onTapGesture {
			self.onProfileTapped?()
		}
	}

	/// Menu items are always scrollable
	private var MenuItemSection: some View {
		ScrollView(.vertical) {
			VStack(alignment: .leading, spacing: 0) {
				ForEach(0 ... self.menuItems.count - 1, id: \.self) {
					self.menuItems[$0]
				}
			}
			.shadow(radius: 0)
		}
	}
}

extension View {
	func withNavDrawer<NavContent: View>(
		visible: Binding<Bool>,
		@ViewBuilder navContent: @escaping () -> NavContent
	) -> some View {
		modifier(NavModifier(visible: visible, navContent: navContent))
	}
}

struct NavDrawer_Previews: PreviewProvider {
	static var previews: some View {
		NavDrawer(visible: .constant(true)) {
			NavDrawerLayout(user: userFake, menuItems: [
				MenuItem(icon: .shoppingBagIcon, text: "Stuff", height: 80) {
					print("Tapped stuff")
				},
				MenuItem(icon: .shoppingBagIcon, text: "Things", height: 80) {
					print("Tapped things")
				},
				MenuItem(icon: .shoppingBagIcon, text: "Longer menu item", height: 80) {
					print("Tapped Foo")
				},
			])
		}
	}
}
