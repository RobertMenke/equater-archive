//
//  CoverPhoto.swift
//  Equater
//
//  Created by Robert B. Menke on 5/17/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

/// Note: this layout is tightly coupled to Profile and ProfileHeader
/// TODO: Rewrite this using Kingfisher or Nuke https://github.com/onevcat/Kingfisher
struct CoverPhoto: View {
	@Injected private var fileService: FilePersistenceService
	@InjectedObject private var viewModel: ProfileViewModel
	let user: User

	var body: some View {
		VStack(alignment: .center) {
			Group {
				if self.viewModel.coverImage != nil {
					CoverPhoto
				} else {
					DefaultCover
				}
			}
		}
		.frameFillParent(alignment: .center)
		.background(AppColor.backgroundSecondary.color)
		.onTapGesture {
			UIApplication.shared.endEditing()
			HapticEngine.shared.play(.buttonTap)
			self.viewModel.showCoverPhotoSheet = true
		}
		.onAppear {
			self.getCoverPhoto()
		}
	}

	/// Displays the current cover photo
	private var CoverPhoto: some View {
		Image(uiImage: self.viewModel.coverImage!)
			.resizable()
			.aspectRatio(contentMode: .fill)
			.frameFillParent()
			.clipped()
			.onTapGesture {
				HapticEngine.shared.play(.buttonTap)
				self.viewModel.showCoverPhotoSheet = true
			}
	}

	/// Displays a vertically and horizontally centered button that prompts a user to upload a photo
	private var DefaultCover: some View {
		HStack(alignment: .center) {
			TextButton(
				label: "Cover Photo",
				enabled: true,
				size: .custom(width: 200, height: 50),
				alignment: .center,
				image: AppImage.add24pt.uiImage,
				isLoading: .constant(false),
				styleButton: { button in
					button.setImageTintColor(AppColor.textPrimary.uiColor, for: .normal)
					button.setTitleColor(AppColor.textPrimary.uiColor, for: .normal)
				},
				onTap: {
					HapticEngine.shared.play(.buttonTap)
					self.viewModel.showCoverPhotoSheet = true
				}
			)
		}
		.frameFillParent(alignment: .center)
	}

	private func getCoverPhoto() {
		fileService.getPhoto(photo: .coverPhoto(user: user), whenAvailable: { image in
			DispatchQueue.main.async {
				self.viewModel.coverImage = image
			}
		})
	}
}

struct CoverPhoto_Previews: PreviewProvider {
	static var previews: some View {
		CoverPhoto(user: userFake)
	}
}
