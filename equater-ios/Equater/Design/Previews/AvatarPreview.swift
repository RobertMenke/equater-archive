//
//  AvatarPreview.swift
//  Equater
//
//  Created by Robert B. Menke on 5/10/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

/// Normally you'd use ProfilePhotoAvatar and AvatarWithFallback would be an internal detail, however,
/// since these previews should exist independently of any user we expose some internals here to show the process
struct AvatarPreview: View {
	@State private var image: UIImage?
	@State private var isShowingModal = false
	@State private var showSelectPhotoModal = false
	@State private var showImageCropper = false

	var body: some View {
		HStack(alignment: .center) {
			Spacer()
			VStack(alignment: .center) {
				Spacer()
				AvatarWithFallback(image: $image, size: .defaultSize, makeFallback: { self.FallbackImage }) {
					self.isShowingModal = true
				}
				Spacer()
			}
			Spacer()
		}
		.frameFillParent()
		.sheet(
			isPresented: $isShowingModal,
			onDismiss: { print("Dismissed sheet") }
		) {
			if self.showImageCropper {
				VStack {
					CropView(
						image: self.$image,
						visible: self.$isShowingModal,
						onComplete: { image in
							self.image = image
						}
					)
				}
			} else {
				ImagePicker(image: self.$image, isTakingPhoto: true) { image in
					guard image != nil else {
						self.isShowingModal = false
						return
					}

					self.showImageCropper = true
				}
			}
		}
	}

	var FallbackImage: some View {
		AppText(getInitials(), font: .primaryText)
			.frame(width: AvatarSize.defaultSize.width, height: AvatarSize.defaultSize.height, alignment: .center)
			.background(CircleBackground())
	}

	private func getInitials() -> String {
		guard userFake.firstName.count > 0, userFake.lastName.count > 0 else {
			return ""
		}

		let firstInitial = String(userFake.firstName[userFake.firstName.startIndex]).uppercased()
		let lastInitial = String(userFake.lastName[userFake.lastName.startIndex]).uppercased()

		return firstInitial + lastInitial
	}
}

struct AvatarPreview_Previews: PreviewProvider {
	static var previews: some View {
		AvatarPreview()
	}
}
