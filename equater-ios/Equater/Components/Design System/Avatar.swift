//
//  Avatar.swift
//  Equater
//
//  Created by Robert B. Menke on 5/6/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

enum AvatarSize {
	var width: CGFloat {
		switch self {
		case .defaultSize:
			return 60
		case .custom(let width, _):
			return width
		}
	}

	var height: CGFloat {
		switch self {
		case .defaultSize:
			return 60
		case .custom(_, let height):
			return height
		}
	}

	case defaultSize
	case custom(width: CGFloat, height: CGFloat)
}

struct CircleBackground: View {
	var background: Color = AppColor.backgroundPrimary.color
	var borderColor: Color = AppColor.backgroundSecondary.color
	var strokeWidth: CGFloat = 2

	var body: some View {
		Circle().overlay(
			Circle().stroke(borderColor, lineWidth: strokeWidth)
		)
		.foregroundColor(background)
	}
}

struct Avatar: View {
	var image: UIImage
	var size: AvatarSize = .defaultSize
	var onTap: (() -> Void)?

	var body: some View {
		Image(uiImage: image)
			.resizable()
			.aspectRatio(contentMode: .fit)
			.frame(width: size.width, height: size.height, alignment: .center)
			.background(CircleBackground())
			.clipShape(Circle())
			.onTapGesture {
				self.onTap?()
			}
	}
}

struct AvatarWithFallback<Fallback: View>: View {
	@Binding var image: UIImage?
	var size: AvatarSize = .defaultSize
	var makeFallback: () -> Fallback
	var onTap: (() -> Void)?

	var body: some View {
		Group {
			if let image = image {
				// TODO: Find a way to avoid force unwrap even though nil check is performed
				Avatar(image: image, size: size, onTap: onTap)
			} else {
				makeFallback().onTapGesture {
					self.onTap?()
				}
			}
		}
	}
}

struct UserInviteAvatar: View {
	var email: String
	var size: AvatarSize = .defaultSize
	var background: Color = AppColor.backgroundPrimary.color
	var borderColor: Color = AppColor.backgroundSecondary.color
	var onTap: (() -> Void)?

	var body: some View {
		VStack(alignment: .center) {
			AppText(getEmailPreview(), font: .primaryText)
				.frame(width: size.width, height: size.height, alignment: .center)
		}
		.frame(width: size.width, height: size.height, alignment: .center)
		.background(CircleBackground(background: background, borderColor: borderColor))
		.onTapGesture { self.onTap?() }
	}

	private func getEmailPreview() -> String {
		email[0 ... 2]
	}
}

struct ProfilePhotoAvatar: View {
	let user: User
	@Binding var image: UIImage?
	var size: AvatarSize = .defaultSize
	var background: Color = AppColor.backgroundPrimary.color
	var borderColor: Color = AppColor.backgroundSecondary.color
	var onTap: (() -> Void)?

	@Injected private var fileService: FilePersistenceService

	var body: some View {
		AvatarWithFallback(
			image: $image,
			size: size,
			makeFallback: { self.FallbackImage },
			onTap: self.onTap
		)
	}

	private var FallbackImage: some View {
		VStack(alignment: .center) {
			FallbackContent
				.frame(width: size.width, height: size.height, alignment: .center)
		}
		.frame(width: size.width, height: size.height, alignment: .center)
		.background(CircleBackground(background: background, borderColor: borderColor))
		.onTapGesture { self.onTap?() }
		.onAppear(perform: self.downloadImage)
	}

	/// If the profile photo avatar is being displayed prior to first name/last name inputs just show an avatar
	private var FallbackContent: some View {
		Group {
			if user.firstName.count > 0, user.lastName.count > 0 {
				AppText(getInitials(), font: .primaryText)
			} else {
				AppImage.avatarIcon.image
			}
		}
	}

	private func getInitials() -> String {
		let firstInitial = String(user.firstName[user.firstName.startIndex]).uppercased()
		let lastInitial = String(user.lastName[user.lastName.startIndex]).uppercased()

		return firstInitial + lastInitial
	}

	private func downloadImage() {
		fileService.getPhoto(photo: .avatar(user: user)) { image in
			self.image = image
		}
	}
}

/// An avatar image that must first be downloaded from a remote source
struct RemoteAvatar<FallbackImage: View>: View {
	@Injected private var fileService: FilePersistenceService
	let photo: Photo
	var makeFallbackImage: () -> FallbackImage
	var size: AvatarSize = .defaultSize
	var onTap: (() -> Void)?
	@State private var remoteImage: UIImage? = nil

	var body: some View {
		AvatarWithFallback(
			image: $remoteImage,
			size: size,
			makeFallback: makeFallbackImage,
			onTap: onTap
		)
		.onAppear {
			self.fileService.getPhoto(photo: photo) {
				self.remoteImage = $0
			}
		}
		.onChange(of: photo) { newValue in
			self.fileService.getPhoto(photo: newValue) {
				self.remoteImage = $0
			}
		}
	}
}

/// An avatar image that must first be downloaded from a remote source
/// Note that FilePersistenceService will cache the image locally as long
/// as its hash has not changed
struct RemoteImage<FallbackImage: View>: View {
	@Injected private var fileService: FilePersistenceService
	let photo: Photo
	var makeFallbackImage: () -> FallbackImage
	var size: AvatarSize = .defaultSize
	@State private var remoteImage: UIImage? = nil

	var body: some View {
		Group {
			if let image = remoteImage {
				Image(uiImage: image).resizable()
			} else {
				makeFallbackImage()
			}
		}
		.onAppear {
			self.fileService.getPhoto(photo: photo) {
				self.remoteImage = $0
			}
		}
		.onChange(of: photo) { newValue in
			self.fileService.getPhoto(photo: newValue) {
				self.remoteImage = $0
			}
		}
	}
}

struct Avatar_Previews: PreviewProvider {
	static var previews: some View {
		ProfilePhotoAvatar(user: userFake, image: .constant(nil))
	}
}
