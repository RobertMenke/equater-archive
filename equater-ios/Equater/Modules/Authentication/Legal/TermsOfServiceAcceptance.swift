//
//  TermsOfServiceAcceptance.swift
//  Equater
//
//  Created by Robert B. Menke on 9/29/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct TermsOfServiceAcceptance: View {
	@ObservedObject var viewModel: AuthenticationViewModel
	@State private var accepted = false

	var body: some View {
		Window {
			HeaderWithContentLayout(
				headerHeight: 144,
				header: Header,
				content: ZStack {
					VStack {
						WebView.forTermsOfService().background(AppColor.backgroundPrimary.color)
					}
					.frameFillParent()
					.padding([.leading, .trailing], 16)
					.padding(.bottom, 140)

					VStack {
						Spacer()
						HStack {
							Toggle(isOn: $accepted, label: {
								AppText("I have read & understood the terms of service for Equater and our payment provider.", font: .custom(size: 14.0, color: .maximumContrast))
									.bold()
									.fixedSize(horizontal: false, vertical: true)
									.multilineTextAlignment(.leading)
									.lineLimit(nil)
							})
						}
						.frameFillWidth(height: 48, alignment: .center)
						.padding(8)
						.background(AppColor.backgroundSecondary.color)
						.cornerRadius(8)

						ContainedButton(
							label: "Agree & Continue",
							enabled: accepted,
							size: .custom(width: .infinity, height: 50),
							isLoading: .constant(false),
							onTap: {
								withAnimation {
									viewModel.set(hasAcceptedTerms: true)
								}
							}
						)
						.padding(.bottom, 40)
					}
					.frameFillParent()
					.padding([.leading, .trailing], 16)
				}
			)
		}
	}

	var Header: some View {
		VStack {
			Spacer()
			HStack(alignment: .bottom) {
				AppText("Terms of Service", font: .jumbo)
					.padding(.bottom, 8)
				Spacer()
			}
			.frameFillParent(alignment: .bottom)
			.padding(.leading, 16)
		}
		.frameFillWidth(height: 144)
	}
}

struct TermsOfServiceAcceptance_Previews: PreviewProvider {
	static var previews: some View {
		TermsOfServiceAcceptance(viewModel: AuthenticationViewModel())
	}
}
