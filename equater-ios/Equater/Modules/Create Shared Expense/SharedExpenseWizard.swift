//
//  SharedExpenseWizard.swift
//  Equater
//
//  Created by Robert B. Menke on 5/24/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

enum SharedExpenseWizardNavigation: String {
	case merchant
	case recurring
}

struct SharedExpenseWizard: View {
	@InjectedObject private var homeScreenViewModel: HomeScreenViewModel
	@State private var selection: String? = nil

	private var purpleGradient = RadialGradient(
		gradient: Gradient(colors: [
			Color(red: 185 / 255, green: 23 / 255, blue: 148 / 255),
			Color(red: 121 / 255, green: 36 / 255, blue: 203 / 255),
		]),
		center: UnitPoint(x: 0.5, y: 1.0),
		startRadius: 0,
		endRadius: 125
	)

	private var blueGradient = RadialGradient(
		gradient: Gradient(colors: [
			Color(red: 44 / 255, green: 110 / 255, blue: 255 / 255),
			Color(red: 37 / 255, green: 47 / 255, blue: 202 / 255),
		]),
		center: UnitPoint(x: 0.5, y: 1.0),
		startRadius: 0,
		endRadius: 125
	)

	var body: some View {
		GeometryReader { (geo: GeometryProxy) in
			ZStack {
				VStack(spacing: 32) {
					Spacer()

					SharedExpenseTypeSelection(
						gradient: purpleGradient,
						title: "Set Up a Shared Bill",
						subtitle: "Pick a merchant like Netflix, tell us who you split it with, and we'll handle settling up automatically when you’re charged.",
						image: .teamworkPurple
					)
					.frameFillWidth(height: (geo.size.height / 2) - 32)
					.shadowSmall()
					.onTapGesture {
						HapticEngine.shared.play(.buttonTap)
						ResolverScope.userSearchCache.reset()
						ResolverScope.vendorSearchCache.reset()
						ResolverScope.merchantExpenseCache.reset()
						homeScreenViewModel.navLinkSelection = SharedExpenseWizardNavigation.merchant.rawValue
					}

					SharedExpenseTypeSelection(
						gradient: blueGradient,
						title: "Set Up Scheduled Payments",
						subtitle: "Create a series of scheduled payments by specifying a start/end date, an interval, payers, and amounts.",
						image: .creditCard3d
					)
					.frameFillWidth(height: (geo.size.height / 2) - 32)
					.shadowSmall()
					.onTapGesture {
						HapticEngine.shared.play(.buttonTap)
						ResolverScope.recurringExpenseCache.reset()
						ResolverScope.userSearchCache.reset()
						homeScreenViewModel.navLinkSelection = SharedExpenseWizardNavigation.recurring.rawValue
					}

					Spacer()
				}
				.frameFillParent()
				.padding([.leading, .trailing], 16)
			}
			.frameFillParent()
			.background(AppColor.backgroundPrimary.color)
		}
	}
}

private struct SharedExpenseOption: View {
	var image: Image
	var height: CGFloat?
	var onTap: (() -> Void)?

	var body: some View {
		HStack(alignment: .center) {
			VStack(alignment: .center) {
				image
					.resizable()
					.aspectRatio(contentMode: .fit)
					.frameFillParent()
					.shadowLarge()
			}
		}
		.frameFillWidth(height: height)
	}
}

struct SharedExpenseWizard_Previews: PreviewProvider {
	static var previews: some View {
		SharedExpenseWizard()
	}
}
