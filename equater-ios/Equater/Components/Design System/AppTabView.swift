//
//  TabView.swift
//  Equater
//
//  Created by Robert B. Menke on 7/4/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct TabItem: Identifiable, Equatable {
	static func == (lhs: TabItem, rhs: TabItem) -> Bool {
		lhs.id == rhs.id
	}

	var id: String { tag }
	let tag: String
	let image: AppImage
	let title: String
	let createContent: () -> AnyView
}

private let TAB_VIEW_HEIGHT: CGFloat = 80
private let TAB_BAR_WIDTH: CGFloat = 64
private let TAB_BAR_SPACING: CGFloat = 24

struct AppTabView: View {
	@InjectedObject private var viewModel: HomeScreenViewModel
	let tabs: [TabItem]
	@Binding var currentPage: Int
	@Binding var selection: String

	var body: some View {
		Window {
			ZStack {
				self.Tabs
				Window {
					PagingView(
						currentPage: $currentPage,
						pages: tabs.map { $0.createContent() },
						onPageChanged: { pageNumber in
							let tab = HomeScreenTab.fromIndex(pageNumber)
							selection = tab.rawValue
							viewModel.setTab(tab)
						}
					)
					.frameFillParent(alignment: .center)
				}
				.padding(.bottom, TAB_VIEW_HEIGHT)
			}
		}
		.offset(y: 0)
	}

	var Tabs: some View {
		GeometryReader { (geo: GeometryProxy) in
			VStack(alignment: .leading) {
				Spacer()

				RoundedRectangle(cornerRadius: 2)
					.fill(AppColor.accentPrimary.color)
					.frame(width: TAB_BAR_WIDTH, height: 4, alignment: .top)
					.offset(x: calculateTabIndicatorXOffset(geo), y: 16)
					.animation(.easeOut)

				HStack(alignment: .top, spacing: TAB_BAR_SPACING) {
					ForEach(self.tabs, id: \.self.id) { tab in
						Tab(item: tab, isSelected: tab.tag == self.selection, onTap: { _ in
							self.selection = tab.tag
							self.currentPage = self.tabs.firstIndex { self.selection == $0.tag } ?? 0
							DispatchQueue.global(qos: .default).async {
								logger.info("User navigated to tab \(tab.title)")
							}
						})
					}
				}
				.frameFillWidth(height: TAB_VIEW_HEIGHT, alignment: .top)
			}
			.edgesIgnoringSafeArea(.bottom)
			.frameFillParent()
		}
	}

	private var selectedTabIndex: Int {
		tabs.firstIndex { tab in
			self.selection == tab.tag
		} ?? 0
	}

	private func calculateTabIndicatorXOffset(_ geo: GeometryProxy) -> CGFloat {
		let middleTab = Int(ceil(Double(tabs.count / 2)))
		let midPoint = geo.size.width / 2 - TAB_BAR_WIDTH / 2
		let differenceFromMiddleTab = CGFloat(currentPage - middleTab)
		let offsetFromCenter = differenceFromMiddleTab * TAB_BAR_WIDTH + differenceFromMiddleTab * TAB_BAR_SPACING

		return midPoint + offsetFromCenter
	}

	private func getTabContent() -> AnyView {
		guard let selectedTab = tabs.first(where: { $0.tag == self.selection }) else {
			return EmptyView().typeErased
		}

		return selectedTab.createContent()
	}
}

struct Tab: View {
	var item: TabItem
	var isSelected: Bool
	var onTap: (TabItem) -> Void
	@State private var scale: CGFloat = 1.0
	@State private var notificationBadgeScale = 1.0
	/// This is an unfortunate hack - wanted this component to be unaware of any view models
	/// but it needs to be able to observe the state of the agreements to get real time updates
	@InjectedObject private var agreementsViewModel: AgreementsViewModel

	var body: some View {
		ZStack {
			VStack(alignment: .center, spacing: 4) {
				getImage()
					.offset(y: -6)
					.scaleEffect(scale)
					.animation(.linear(duration: 0.1))
				AppText(item.title, font: .custom(size: 10.0, color: .textPrimary))
					.offset(y: -8)
					.scaleEffect(scale)
					.animation(.linear(duration: 0.1))
			}
			.frameFillHeight(width: TAB_BAR_WIDTH, alignment: .center)

			if item.title == "Manage", agreementsViewModel.countOfInvitations > 0 {
				VStack {
					Badge(count: agreementsViewModel.countOfInvitations, appColor: .accentPrimaryForText)
						.padding(.top, 4)
						.scaleEffect(self.notificationBadgeScale)
						.animation(.linear(duration: 0.3))
						.onAppear {
							withAnimation {
								self.notificationBadgeScale = 1.5
							}
							DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
								withAnimation {
									self.notificationBadgeScale = 1.0
								}
							}
						}

					Spacer()
				}
				.frameFillHeight(width: TAB_BAR_WIDTH, alignment: .trailing)
			}
		}
		.onTapGesture {
			onTap(item)
			if !isSelected {
				scale = 0.8
				DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
					scale = 1.0
				}
			}
		}
	}

	private func getImage() -> some View {
		isSelected ? getSelectedImage().typeErased : getUnselectedImage().typeErased
	}

	private func getSelectedImage() -> some View {
		item
			.image
			.image
			.resizable()
			.aspectRatio(contentMode: .fit)
			.frame(height: 30).typeErased
	}

	private func getUnselectedImage() -> some View {
		item
			.image
			.image
			.renderingMode(.template)
			.resizable()
			.aspectRatio(contentMode: .fit)
			.foregroundColor(AppColor.textPrimary.color)
			.frame(height: 30).typeErased
	}
}

struct TabView_Previews: PreviewProvider {
	static var previews: some View {
		AppTabView(
			tabs: [
				TabItem(
					tag: "test",
					image: .avatarIcon,
					title: "Test",
					createContent: { Text("Test").typeErased }
				),
			],
			currentPage: .constant(0),
			selection: .constant("test")
		)
	}
}
