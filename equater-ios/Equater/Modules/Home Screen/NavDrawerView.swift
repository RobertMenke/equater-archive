//
//  NavDrawerView.swift
//  Equater
//
//  Created by Robert B. Menke on 5/25/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

extension View {
	func navDrawer(currentScreen: Binding<HomeScreenNavigation>, user: User) -> some View {
		modifier(NavDrawerView(currentScreen: currentScreen, user: user))
	}
}

struct NavDrawerView: ViewModifier {
	@Injected private var appState: AppState
	@Injected private var homeScreenViewModel: HomeScreenViewModel
	@State private var showNavDrawer = false
	@Binding var currentScreen: HomeScreenNavigation
	var user: User

	func body(content: Content) -> some View {
		NavigationView {
			Window {
				content
					.navigationBarItems(leading: self.LeadingNavItem, trailing: getTrailingNavItem())
					.navigationBarTitle(Text(currentScreen.getHeaderTitle(viewModel: homeScreenViewModel)), displayMode: .inline)
			}
			// For some reason offset(y: 1) causes the view to align properly :/
			.offset(y: 1)
		}
		.withNavDrawer(
			visible: $showNavDrawer,
			navContent: {
				NavDrawerLayout(
					user: self.user,
					menuItems: self.createNavDrawerMenuItems()
				)
			}
		)
	}

	private var LeadingNavItem: some View {
		VStack(alignment: .center) {
			AppImage
				.drawer
				.image
				.resizable()
				.aspectRatio(contentMode: .fit)
				.frame(minHeight: 0, maxHeight: 36)
		}
		.frameFillHeight(width: 48, alignment: .center)
		.onTapGesture {
			HapticEngine.shared.play(.buttonTap)
			self.showNavDrawer = !self.showNavDrawer
		}
	}

	private func getTrailingNavItem() -> some View {
		if homeScreenViewModel.selectedTab == HomeScreenTab.viewTransactions.rawValue {
			return VStack {
				AppImage
					.walletGray
					.image
					.resizable()
					.aspectRatio(contentMode: .fit)
					.frame(minHeight: 0, maxHeight: 36)
			}
			.frameFillHeight(width: 48, alignment: .center)
			.onTapGesture {
				homeScreenViewModel.navLinkSelection = "equater-balance"
			}
			.typeErased
		}

		return EmptyView().typeErased
	}

	private func createNavDrawerMenuItems() -> [MenuItem] {
		HomeScreenNavigation.allCases.map { navItem in
			MenuItem(icon: navItem.appImage, text: navItem.getNavTitle(), height: 65.0) {
				if navItem == .signOut {
					ResolverScope.verificationCache.reset()
					self.appState.signOut()
				} else {
					self.set(destination: navItem)
					if navItem == .createAgreement {
						homeScreenViewModel.setTab(.createAgreement)
					}

					if navItem == .manageAgreements {
						homeScreenViewModel.setTab(.manageAgreements)
					}

					if navItem == .transactionHistory {
						homeScreenViewModel.setTab(.viewTransactions)
					}

					// Try to make sure the underlying content gets rendered before the nav drawer recedes
					DispatchQueue.main.async {
						self.showNavDrawer = false
					}
				}
			}
		}
	}

	private func set(destination: HomeScreenNavigation) {
		currentScreen = destination
	}
}
