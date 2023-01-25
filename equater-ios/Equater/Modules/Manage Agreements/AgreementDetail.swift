//
//  AgreementDetail.swift
//  Equater
//
//  Created by Robert B. Menke on 6/28/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct AgreementDetail: View {
	@InjectedObject private var viewModel: AgreementsViewModel
	@InjectedObject private var appState: AppState
	@State private var selection: String? = nil
	@Binding var story: SharedExpenseStory
	@Binding var sheetIsShown: Bool

	var body: some View {
		DetailView
	}

	var DetailView: some View {
		VStack {
			VStack {
				Spacer()
				createHeader()
				Spacer()
			}
			.frameFillWidth(height: 150, alignment: .center)
			.padding(.top, 100)

			Spacer()

			VStack {
				HStack {
					if story.initiatingUser.id != appState.user?.id {
						AppText(story.getStatusDisplay(), font: .primaryText)
					} else {
						Select(selection: "Actions").onTapGesture {
							sheetIsShown = true
						}
					}
				}
				.frame(width: 110, height: 80, alignment: .center)

				ScrollView {
					VStack {
						AgreementUserCard(story: story, user: .right(story.initiatingUser), showAgreementStatus: true)

						ForEach(self.story.activeUsers) { user in
							AgreementUserCard(story: story, user: .right(user), showAgreementStatus: true)
						}

						ForEach(self.story.prospectiveUsers) { invite in
							AgreementUserCard(story: story, user: .left(invite), showAgreementStatus: true)
						}
					}
				}
				.padding(.bottom, 70)
			}
			.background(AppColor.backgroundSecondary.color)
			.cornerRadius(36, corners: [.topLeft, .topRight])
			.frameFillParent()
		}
		.frameFillParent()
		.onAppear {
			DispatchQueue.global(qos: .default).async {
				if let agreement = viewModel.getAgreement(forStory: self.story) {
					logger.info("User navigated to agreement detail for \(agreement.id)")
				}
			}
		}
	}

	private func createHeader() -> some View {
		VStack {
			if let vendor = story.vendor {
				RemoteAvatar(
					photo: .vendorLogo(vendor: vendor),
					makeFallbackImage: { DefaultVendorImage() },
					onTap: {}
				)

				AppText(story.sharedExpense.expenseNickName, font: .primaryText)

			} else {
				AppImage
					.clockIconClipped
					.image
					.resizable()
					.aspectRatio(contentMode: .fit)
					.frame(width: AvatarSize.defaultSize.width, height: AvatarSize.defaultSize.height)

				AppText(viewModel.getFrequencyText(sharedExpense: story.sharedExpense), font: .primaryText)
				AppText(viewModel.getNextPaymentDateText(sharedExpense: story.sharedExpense), font: .subText)
			}
		}
		.frameFillWidth(height: nil, alignment: .center)
	}
}

struct AgreementDetail2_Previews: PreviewProvider {
	static var previews: some View {
		AgreementDetail(story: .constant(sharedExpenseStoryFake), sheetIsShown: .constant(false))
	}
}
