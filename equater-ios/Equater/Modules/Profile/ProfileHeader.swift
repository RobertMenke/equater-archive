//
//  ProfileHeader.swift
//  Equater
//
//  Created by Robert B. Menke on 5/17/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct ProfileHeader: View {
	@InjectedObject private var viewModel: ProfileViewModel
	let user: User
	private let avatarSize: AvatarSize = .custom(width: 75, height: 75)
	@State private var sheetActive = false

	var body: some View {
		GeometryReader { geo in
			ZStack {
				CoverPhoto(user: self.user)
				HStack(alignment: .bottom) {
					ZStack {
						ProfilePhotoAvatar(
							user: self.user,
							image: self.$viewModel.avatar,
							size: self.avatarSize,
							background: AppColor.backgroundSecondary.color,
							borderColor: AppColor.backgroundPrimary.color,
							onTap: {
								UIApplication.shared.endEditing()
								HapticEngine.shared.play(.buttonTap)
								self.viewModel.showAvatarSheet = true
							}
						)
						.padding(.leading, 25)

						self.PlusIcon
					}
				}
				.frameFillWidth(height: 75)
				.offset(y: geo.size.height / 2)
			}
			.frameFillParent()
		}
	}

	private var PlusIcon: some View {
		Group {
			if self.viewModel.avatar == nil {
				AppImage
					.add18pt
					.image
					.colorMultiply(AppColor.accentPrimary.color)
					.offset(x: -5, y: -15)
			}
		}
	}
}

struct ProfileHeader_Previews: PreviewProvider {
	static var previews: some View {
		ProfileHeader(user: userFake)
	}
}
