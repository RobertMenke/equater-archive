//
//  Profile.swift
//  Equater
//
//  Created by Robert B. Menke on 5/17/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct Profile: View {
	@InjectedObject private var viewModel: ProfileViewModel
	@InjectedObject private var photoUploadViewModel: PhotoUploadViewModel
	let user: User
	var showFormInstructions = true
	var onSaveSuccessful: (() -> Void)?
	@State private var uploadType: PhotoUploadType = .takePicture
	@State private var isUploadingPhoto = false
	@State private var photo: Photo

	init(user: User, showFormInstructions: Bool = true, onSaveSuccessful: (() -> Void)? = nil) {
		self.user = user
		self.showFormInstructions = showFormInstructions
		self.onSaveSuccessful = onSaveSuccessful
		photo = .avatar(user: user)
	}

	var body: some View {
		GeometryReader { geo in
			Window {
				HeaderWithContentLayout(
					headerHeight: geo.size.height / 4,
					header: ProfileHeader(user: self.user),
					content: ProfileForm(
						user: self.user,
						showFormInstructions: self.showFormInstructions,
						onSaveSuccessful: self.onSaveSuccessful
					)
				)
			}
			.profilePhoto(
				isVisible: self.$isUploadingPhoto,
				image: self.viewModel.showCoverPhotoSheet ? self.$photoUploadViewModel.coverPhoto : self.$photoUploadViewModel.avatarPhoto,
				uploadType: self.uploadType,
				photo: self.$photo,
				onCompletion: { photoType, image in
					self.viewModel.showAvatarSheet = false
					self.viewModel.showCoverPhotoSheet = false
					self.isUploadingPhoto = false
					guard let image = image else { return }
					switch photoType {
					case .avatar:
						self.photoUploadViewModel.avatarPhoto = image
						self.viewModel.avatar = image
					case .coverPhoto:
						self.photoUploadViewModel.coverPhoto = image
						self.viewModel.coverImage = image
					default:
						break
					}
				}
			)
			.withSheet(visible: self.$viewModel.showAvatarSheet, sheetContent: {
				MenuItem(icon: .photoIcon, text: "Choose Photo") {
					self.photo = .avatar(user: user)
					self.uploadType = .selectPicture
					self.isUploadingPhoto = true
				}
				MenuItem(icon: .cameraIcon, text: "Take Picture") {
					self.photo = .avatar(user: user)
					self.uploadType = .takePicture
					self.isUploadingPhoto = true
				}
				MenuItem(icon: .closeIconColorFilled, text: "Cancel") {
					HapticEngine.shared.play(.buttonTap)
					self.viewModel.showAvatarSheet = false
				}
			})
			.withSheet(visible: self.$viewModel.showCoverPhotoSheet, sheetContent: {
				MenuItem(icon: .photoIcon, text: "Choose Photo") {
					self.photo = .coverPhoto(user: user)
					self.uploadType = .selectPicture
					self.isUploadingPhoto = true
				}
				MenuItem(icon: .cameraIcon, text: "Take Picture") {
					self.photo = .coverPhoto(user: user)
					self.uploadType = .takePicture
					self.isUploadingPhoto = true
				}
				MenuItem(icon: .closeIconColorFilled, text: "Cancel") {
					HapticEngine.shared.play(.buttonTap)
					self.viewModel.showCoverPhotoSheet = false
				}
			})
			.offset(y: 1.0)
			.navigationTitle(Text("Profile"))
		}
	}
}

struct Profile_Previews: PreviewProvider {
	static var previews: some View {
		Profile(user: userFake)
	}
}
