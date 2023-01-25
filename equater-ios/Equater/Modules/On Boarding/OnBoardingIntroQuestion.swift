//
//  OnBoardingIntroQuestion.swift
//  Equater
//
//  Created by Robert B. Menke on 1/16/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import ConfettiSwiftUI
import Resolver
import SwiftUI

struct OnBoardingIntroQuestion: View {
	@InjectedObject private var viewModel: OnBoardingViewModel
	@State private var selectedOption: OnBoardingOption? = nil
	@State private var navigationTag: String? = nil
	@State private var confettiIsActive = false
	@State private var confettiCounter = 0

	var body: some View {
		NavigationView {
			Window {
				// Navigation links are hidden
				NavigationLink(
					destination: OnBoardingSharedBill(),
					tag: OnBoardingOption.splitBills.navigationTag,
					selection: self.$navigationTag,
					label: { EmptyView() }
				)
				.hidden()

				NavigationLink(
					destination: OnBoardingRecurringExpense(),
					tag: OnBoardingOption.chargingTenants.navigationTag,
					selection: self.$navigationTag,
					label: { EmptyView() }
				)
				.hidden()

				NavigationLink(
					destination: ExplainReasonForAppUsage(),
					tag: OnBoardingOption.somethingElse.navigationTag,
					selection: self.$navigationTag,
					label: { EmptyView() }
				)
				.hidden()

				ZStack {
					VStack(alignment: .leading, spacing: 5) {
						Spacer()

						VStack {
							AppText("What brings you to Equater?", font: .title)
								.frameFillWidth(height: nil, alignment: .leading)
								.padding(.bottom, 4)
								.multilineTextAlignment(.leading)

							AppText("We're thrilled to have you on board 🥳! Now, we'll help create your first shared bill or scheduled payment.", font: .subtitle)
								.lineSpacing(3)
						}
						.frameFillWidth(height: nil, alignment: .leading)
						.padding(.top, 36)
						.padding(.bottom, 24)

						ForEach(OnBoardingOption.allCases.indices, id: \.self) { index in
							Option(
								isSelected: selectedOption?.rawValue == OnBoardingOption.allCases[index].rawValue,
								option: OnBoardingOption.allCases[index]
							)
							.onTapGesture {
								confettiCounter += 1
								withAnimation {
									selectedOption = OnBoardingOption.allCases[index]
								}
							}
						}

						VStack {
							Spacer()
							ContainedButton(
								label: "Next",
								enabled: true,
								size: .custom(width: .infinity, height: 60),
								isLoading: .constant(false),
								onTap: {
									if let option = selectedOption {
										ResolverScope.userSearchCache.reset()
										ResolverScope.vendorSearchCache.reset()
										ResolverScope.recurringExpenseCache.reset()
										ResolverScope.merchantExpenseCache.reset()
										self.navigationTag = option.navigationTag
										if option != .somethingElse {
											viewModel.sendFeedback(OnBoardingFeedback(
												selection: option,
												additionalFeedback: nil
											))
										}
									} else {
										showSnackbar(message: "We'd love to know how we can best serve you ❤️. Mind selecting from the options above?")
									}
								}
							)

							SkipOnBoarding().padding(.top, 16)
						}
						.frameFillWidth(height: 130)
						.padding(.bottom, 16)
						.padding(.top, 32)

						Spacer()
					}
					.frameFillParent()
					.padding([.leading, .trailing], 14)

					ConfettiCannon(
						counter: $confettiCounter,
						confettis: [.text("❤️"), .text("💙"), .text("💚"), .text("🧡"), .text("💜")],
						confettiSize: 14,
						repetitions: 3,
						repetitionInterval: 0.1
					)
				}
			}
			.navigationBarHidden(true)
			.navigationBarTitle("")
		}
		.onAppear {
			viewModel.madeItToMigrationScreen = true
			if viewModel.showConfettiAnimation {
				DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
					confettiCounter += 1
				}
			}
		}
	}
}

/// Note, the view should be hidden when the keyboard appears.
/// the default keyboard avoiding behavior pushes this view up
/// underneath things that should be in focus at times and
/// hiding the view is the simplest option
struct SkipOnBoarding: View {
	@InjectedObject private var onBoardingViewModel: OnBoardingViewModel
	@State private var isVisible = true
	private let willShow = NotificationCenter.default.publisher(for: UIApplication.keyboardWillShowNotification)
	private let willHide = NotificationCenter.default.publisher(for: UIApplication.keyboardWillHideNotification)

	var body: some View {
		HStack(alignment: .center) {
			if isVisible {
				Spacer()
				TextButton(
					label: "Skip On-Boarding",
					enabled: true,
					size: .custom(width: 180, height: 50),
					alignment: .center,
					isLoading: .constant(false),
					textColor: .accentPrimaryForText,
					onTap: {
						onBoardingViewModel.set(hasSeenOnBoarding: true)
					}
				)
				Spacer()
			}
		}
		.frameFillWidth(height: 50)
		.onReceive(willShow) { _ in
			isVisible = false
		}
		.onReceive(willHide) { _ in
			isVisible = true
		}
	}
}

enum OnBoardingOption: String, Identifiable, Codable, CaseIterable {
	case splitBills
	case splitSubscriptions
	case chargingTenants
	case somethingElse

	var id: String {
		rawValue
	}

	var text: String {
		switch self {
		case .splitBills:
			return "Splitting bills with roommate(s)"
		case .splitSubscriptions:
			return "Splitting subscriptions with friends"
		case .chargingTenants:
			return "Charging tenants for rent"
		case .somethingElse:
			return "Something else"
		}
	}

	var navigationTag: String {
		switch self {
		case .splitBills, .splitSubscriptions:
			return "shared bill"
		case .chargingTenants:
			return "recurring bill"
		case .somethingElse:
			return "something else"
		}
	}
}

private struct Option: View {
	var isSelected: Bool
	var option: OnBoardingOption
	private let outerCircleDiameter: CGFloat = 32
	private let innerCircleDiameter: CGFloat = 16

	var body: some View {
		HStack(alignment: .center) {
			if isSelected {
				ActiveCircle
					.padding(.leading, 16)
					.transition(AnyTransition.opacity)
			} else {
				InactiveCircle
					.padding(.leading, 16)
					.transition(AnyTransition.opacity)
			}

			AppText(option.text, font: .primaryText)
				.padding(.leading, 16)
		}
		.frame(
			minWidth: 0,
			maxWidth: .infinity,
			minHeight: 70,
			maxHeight: nil,
			alignment: Alignment.leading
		)
		.background(isSelected ? AppColor.backgroundSecondary.color : AppColor.backgroundPrimary.color)
		.cornerRadius(8)
	}

	var ActiveCircle: some View {
		ZStack(alignment: .center) {
			Circle()
				.strokeBorder(AppColor.accentPrimary.color, lineWidth: 1)
				.frame(width: outerCircleDiameter, height: outerCircleDiameter)

			Circle()
				.fill(AppColor.accentPrimary.color)
				.frame(width: innerCircleDiameter, height: innerCircleDiameter)
		}
	}

	var InactiveCircle: some View {
		Circle()
			.strokeBorder(AppColor.textPrimary.color, lineWidth: 1)
			.frame(width: outerCircleDiameter, height: outerCircleDiameter)
	}
}

struct OnBoardingIntroQuestion_Previews: PreviewProvider {
	static var previews: some View {
		OnBoardingIntroQuestion()
	}
}
