//
//  SlideToConfirm.swift
//  Equater
//
//  Created by Robert B. Menke on 10/20/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

private let defaultSliderWidth: CGFloat = 60

struct SlideToConfirmCompletion {
	let setCompletionState: (Bool) -> Void
}

struct SlideToConfirm: View {
	var slideInstructionText: String
	var slideCompletedText: String
	@Binding var isLoading: Bool
	var completion: (SlideToConfirmCompletion) -> Void
	@State private var sliderWidth: CGFloat = defaultSliderWidth
	@State private var completed = false
	@State private var checkMarkOpacity: Double = 0
	@State private var arrowOpacity: Double = 100
	@State private var arrowRotation: Double = 0

	var body: some View {
		// The dark red view that slides is on top and the lighter red view containing instructions is underneath
		ZStack {
			// Box underneath the contains the instruction to slide
			HStack(alignment: .center) {
				HStack {
					Spacer()
					Text(slideInstructionText)
						.font(.custom("Inter", size: 16.0))
						.foregroundColor(AppColor.white.color)
						.fontWeight(.semibold)
					Spacer()
				}
				.frameFillParent(alignment: .center)
			}
			.frameFillWidth(height: 50)
			.background(AppColor.redSwipeToCancelLight.color)
			.cornerRadius(4)

			// This is the view that will slide as the user drags their finger from left to right
			HStack {
				GeometryReader { (geo: GeometryProxy) in
					HStack {
						ZStack {
							// This view contains the icon and ensures the icon is pinned to the right side of the view
							HStack {
								Spacer()
								ZStack {
									if isLoading {
										ActivityIndicator(isAnimating: .constant(true), style: .medium).padding(.trailing, 14)
									} else {
										AppImage
											.simpleCheckMark
											.image
											.resizable()
											.aspectRatio(contentMode: .fit)
											.frame(height: 30.0)
											.padding(.trailing, 14)
											.opacity(isLoading ? 100 : checkMarkOpacity)

										AppImage
											.chevronRightDouble
											.image
											.resizable()
											.aspectRatio(contentMode: .fit)
											.frame(height: 30.0)
											.padding(.trailing, 14)
											.opacity(isLoading ? 0 : arrowOpacity)
									}
								}
							}

							// This contains the completed text, like "Canceled"
							HStack {
								Text(slideCompletedText)
									.font(.custom("Inter", size: 16.0))
									.foregroundColor(AppColor.white.color)
									.fontWeight(.bold)
									.opacity(calculateCompletedTextOpacity(geo))
									.lineLimit(1)
							}
							.frameFillParent(alignment: .center)
						}
					}
					.frameFillHeight(width: isLoading ? geo.size.width : sliderWidth)
					.background(AppColor.redDecline.color)
					.cornerRadius(4)
					.shadowMedium()
					.gesture(
						DragGesture()
							.onChanged { value in
								guard !completed, !isLoading else { return }
								let maxWidth = max(defaultSliderWidth + value.translation.width, defaultSliderWidth)
								sliderWidth = min(maxWidth, geo.size.width)
							}
							.onEnded { _ in
								guard !completed else { return }
								if sliderWidth == geo.size.width {
									HapticEngine.shared.play(.buttonTap)
									completed = true
									completion(
										SlideToConfirmCompletion {
											setCompletionState: do {
												completed = $0
												if !$0 {
													arrowOpacity = 100
													checkMarkOpacity = 0
													restoreDefaultState()
												}
											}
										}
									)
								} else {
									restoreDefaultState()
								}
							}
					)
				}
				.frameFillWidth(height: 60)
			}
		}
	}

	private func restoreDefaultState() {
		withAnimation(.spring()) {
			sliderWidth = defaultSliderWidth
			arrowOpacity = 100
			checkMarkOpacity = 0
		}
	}

	private func calculateCompletedTextOpacity(_ geo: GeometryProxy) -> Double {
		if isLoading {
			return geo.size.width
		}

		// Don't show the completed text if the slider is less than halfway complete
		let halfwayPoint = geo.size.width / 2

		if sliderWidth < halfwayPoint {
			return 0
		}

		return Double((sliderWidth - halfwayPoint) / halfwayPoint)
	}
}

struct SlideToConfirm_Previews: PreviewProvider {
	static var previews: some View {
		SlideToConfirm(
			slideInstructionText: "Swipe to cancel agreement",
			slideCompletedText: "Canceled",
			isLoading: .constant(false)
		) { _ in
			print("Canceled")
		}
	}
}
