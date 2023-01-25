//
//  ExplainReasonForAppUsage.swift
//  Equater
//
//  Created by Robert B. Menke on 1/17/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct ExplainReasonForAppUsage: View {
	@InjectedObject private var viewModel: OnBoardingViewModel
	@State private var text = ""
	@State private var showKeyboard = false

	var body: some View {
		Window {
			VStack {
				AppText("Great! We'd love to hear more.", font: .title)
					.padding(.top, 24)
					.multilineTextAlignment(.leading)
				AppText("Let us know why you're using Equater, or skip ahead to the app!", font: .subtitle)
					.multilineTextAlignment(.leading)

				MultilineTextField(
					"Why you're using Equater",
					text: $text
				) {
					print(text)
				}
				.frameFillWidth(height: 200)
				.background(AppColor.backgroundSecondary.color)
				.cornerRadius(8)
				.onTapGesture {
					showKeyboard = true
				}

				ContainedButton(
					label: "Done",
					enabled: true,
					size: .custom(width: .infinity, height: 60),
					isLoading: .constant(false),
					onTap: {
						viewModel.sendFeedback(OnBoardingFeedback(
							selection: .somethingElse,
							additionalFeedback: text
						))

						viewModel.set(hasSeenOnBoarding: true)

						if text.trimmingCharacters(in: .whitespacesAndNewlines).count > 0 {
							DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
								showSnackbar(message: "Thanks for letting us know!")
							}
						}
					}
				)
				.padding(.top, 16)
			}
			.padding([.leading, .trailing], 14)
			.padding(.top, 128)
		}
		.navigationBarTitle(Text(""), displayMode: .inline)
	}
}

struct ExplainReasonForAppUsage_Previews: PreviewProvider {
	static var previews: some View {
		ExplainReasonForAppUsage()
	}
}
