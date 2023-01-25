//
//  WelcomeToEquater.swift
//  Equater
//
//  Created by Robert B. Menke on 7/10/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

let HAS_SEEN_HOME_SCREEN = "HAS_SEEN_HOME_SCREEN"

private let startGradient = Gradient(colors: [AppColor.royalBlueLight.color, AppColor.accentMedium.color])
private let endGradient = Gradient(colors: [AppColor.accentMedium.color, AppColor.royalBlueLight.color])

struct WelcomeToEquater: View {
	@InjectedObject var authenticationViewModel: AuthenticationViewModel
	@State var showTitle = false
	@State var showSubtitle = false
	@State var showButtons = false
	@State private var lottieScale = 0.9
	@State private var gradientAnimationProgress = 0.0

	var body: some View {
		Window {
			VStack {
				LottieView
					.levitatingFinanceMan()
					.frameFillWidth(height: 400)
					.padding(.top, 32)
					.scaleEffect(lottieScale)

				if showTitle {
					AppText("Split recurring bills", font: .custom(size: 32, color: .textPrimary))
						.fontWeight(.heavy)
						.frameFillWidth(height: nil, alignment: .center)
						.padding([.leading, .trailing], 16)
						.multilineTextAlignment(.center)
						.offset(y: -40)

					AppText("automatically", font: .custom(size: 32, color: .textPrimary))
						.fontWeight(.heavy)
						.animatableForegroundGradient(fromGradient: startGradient, toGradient: endGradient, progress: gradientAnimationProgress)
						.offset(y: -48)
						.onAppear {
							withAnimation(.linear(duration: 3.0).repeatForever(autoreverses: true)) {
								self.gradientAnimationProgress = 1.0
							}
						}
				}

				if showSubtitle {
					AppText("Equater is built for shared monthly expenses. Tell us how you split your expenses and we'll settle up for you.", font: .subtitle)
						.transition(AnyTransition.opacity.animation(.easeIn(duration: 0.5)))
						.padding([.leading, .trailing], 32)
						.multilineTextAlignment(.leading)
						.lineSpacing(3)
						.offset(y: -30)
				}

				if showButtons {
					SignInActions()
						.offset(y: -18)
				}

				Spacer()
			}
			.padding(.top, 44)
		}
		.sheet(isPresented: self.$authenticationViewModel.authFlowIsActive) {
			Group {
				if self.authenticationViewModel.authFlow == .registration {
					Register()
				} else {
					SignIn()
				}
			}
		}
		.onAppear {
			withAnimation(.easeOut(duration: 0.85)) {
				self.lottieScale = 1.0
			}

			DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
				withAnimation(.easeOut(duration: 0.5)) {
					self.showTitle = true
				}
			}

			DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
				withAnimation(.easeOut(duration: 0.5)) {
					self.showSubtitle = true
				}
			}

			DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
				withAnimation(.easeOut(duration: 0.5)) {
					self.showButtons = true
				}
			}
		}
	}
}

struct WelcomeToEquater_Previews: PreviewProvider {
	static var previews: some View {
		WelcomeToEquater()
	}
}
