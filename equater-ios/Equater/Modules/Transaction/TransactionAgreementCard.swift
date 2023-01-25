//
//  TransactionAgreementCard.swift
//  Equater
//
//  Created by Robert B. Menke on 7/5/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct TransactionAgreementCard: View {
	@Environment(\.presentationMode) var presentationMode: Binding<PresentationMode>
	var story: SharedExpenseStory
	@InjectedObject private var homeScreenViewModel: HomeScreenViewModel
	@State private var selection: String? = nil

	var body: some View {
		ZStack {
			NavigationLink(
				destination: AgreementDetailView(story: story),
				tag: "expense-agreement-nested",
				selection: $selection,
				label: { EmptyView() }
			)
			.hidden()

			Card
		}
	}

	var Card: some View {
		HStack(alignment: .center) {
			self.makeAvatar()

			VStack(alignment: .leading) {
				AppText("\(self.story.initiatingUser.firstName) \(self.story.initiatingUser.lastName)", font: .subText)
					.padding(.leading, 4)

				AppText(self.story.sharedExpense.expenseNickName, font: .primaryText)
					.padding(.leading, 4)
			}
			.frameFillWidth(height: nil, alignment: .leading)

			Spacer()

			Image(systemName: "chevron.right")
				.font(.system(size: 16.0, weight: .bold))
				.foregroundColor(AppColor.textPrimary.color)
		}
		.padding([.trailing, .leading], 16)
		.padding([.top, .bottom], 10)
		.frameFillWidth(height: 80, alignment: .center)
		.foregroundColor(.secondary)
		.background(AppColor.backgroundSecondary.color)
		.cornerRadius(8)
		.shadowSmall()
		.onTapGesture {
			selection = "expense-agreement-nested"
		}
		.navigationBarTitle(Text(""), displayMode: .inline)
	}

	private func makeAvatar() -> some View {
		if let vendor = story.vendor {
			return RemoteAvatar(
				photo: .vendorLogo(vendor: vendor),
				makeFallbackImage: { DefaultVendorImage() }
			).typeErased
		}

		return AppImage
			.clockIconClipped
			.image
			.resizable()
			.aspectRatio(contentMode: .fit)
			.frame(width: AvatarSize.defaultSize.width, height: AvatarSize.defaultSize.height)
			.typeErased
	}
}

struct TransactionAgreementCard_Previews: PreviewProvider {
	static var previews: some View {
		TransactionAgreementCard(story: sharedExpenseStoryFake)
	}
}
