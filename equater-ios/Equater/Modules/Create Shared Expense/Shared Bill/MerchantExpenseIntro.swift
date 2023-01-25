//
//  SharedExpenseIntro.swift
//  Equater
//
//  Created by Robert B. Menke on 5/27/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct MerchantExpenseIntro: View {
	let text: String
	var buttonText = "Find Payers"
	let onContinue: () -> Void

	var body: some View {
		VStack(alignment: .center) {
			Spacer()

			LottieView
				.sharedBillAnimation()
				.frameFillWidth(height: nil)
				.padding(.top, 100)
				.padding([.leading, .trailing], 40)

			Spacer()

			WizardNextButton(text: text, buttonText: buttonText, isLoading: .constant(false), onContinue: onContinue)
		}
		.frameFillParent()
		.padding(15)
	}

	var VendorPreview: some View {
		HStack {
			SmallLogoAvatar(image: AppImage.dukeEnergyLogoTransparent.uiImage, backgroundColor: Color.white, initialDirection: .right)
			Spacer()
			SmallLogoAvatar(image: AppImage.netflixLogoTransparent.uiImage, backgroundColor: Color.black, initialDirection: .left)
			Spacer()
			SmallLogoAvatar(image: AppImage.spotifyLogoTransaprent.uiImage, logoSize: 60, backgroundColor: Color.black, initialDirection: .right)
			Spacer()
			SmallLogoAvatar(image: AppImage.targetLogoTransaprent.uiImage, backgroundColor: Color.white, initialDirection: .left)
		}
		.frameFillWidth(height: 100, alignment: .center)
	}
}

private enum AnimationDirection {
	case left
	case right
}

private struct SmallLogoAvatar: View {
	var image: UIImage
	var size: AvatarSize = .defaultSize
	var logoSize: CGFloat = 30.0
	var backgroundColor: Color
	var initialDirection: AnimationDirection
	@State private var animationAngle: Double = 0

	var body: some View {
		VStack {
			Image(uiImage: image)
				.resizable()
				.aspectRatio(contentMode: .fit)
				.frame(maxWidth: logoSize, alignment: .center)
				.background(
					Circle()
						.foregroundColor(backgroundColor)
						.frame(width: size.width, height: size.height, alignment: .center)
				)
		}
		.frame(width: size.width, height: size.height, alignment: .center)
		.rotationEffect(.degrees(animationAngle))
		.onAppear {
			withAnimation(.easeInOut(duration: 2)) {
				animationAngle = initialDirection == .right ? 30.0 : -30.0
			}

			changeAngle()
		}
	}

	private func changeAngle() {
		DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
			withAnimation(.easeInOut(duration: 2)) {
				animationAngle = animationAngle * -1
			}

			changeAngle()
		}
	}
}

struct SharedExpenseIntro_Previews: PreviewProvider {
	static var previews: some View {
		MerchantExpenseIntro(text: "Who would you like to split this expense with?") {
			print("Tapped")
		}
	}
}
