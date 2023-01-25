//
//  SelectedUserCard.swift
//  Equater
//
//  Created by Robert B. Menke on 2/16/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Bow
import SwiftUI

struct SelectedUserCard: View {
	var user: User
	var onRemovalRequested: (User) -> Void

	@SwiftUI.State private var profileImage: UIImage? = nil

	var body: some View {
		ZStack {
			imageWithPadding
			closeIcon
		}
		.frame(
			minWidth: 0,
			maxWidth: 100,
			minHeight: 45,
			maxHeight: 45,
			alignment: Alignment.leading
		)
	}

	var closeIcon: some View {
		HStack {
			AppImage.closeIconColorFilled.image
				.resizable()
				.aspectRatio(contentMode: .fit)
				.frame(width: 36, height: 36, alignment: .center)
				.position(x: 5, y: 5)
		}
		.onTapGesture {
			self.onRemovalRequested(self.user)
		}
	}

	var imageWithPadding: some View {
		HStack {
			ProfilePhotoAvatar(user: user, image: self.$profileImage)
		}
		.frame(
			minWidth: 0,
			maxWidth: 60,
			minHeight: 60,
			maxHeight: 60,
			alignment: Alignment.leading
		)
		.padding(EdgeInsets(top: 2, leading: 2, bottom: 2, trailing: 2))
		.cornerRadius(8.0)
		.shadow(radius: 2.0)
	}
}

struct SelectedUserCard_Previews: PreviewProvider {
	static var previews: some View {
		SelectedUserCard(user: userFake, onRemovalRequested: { user in
			print("Selected user with id: \(user.id) and email: \(user.email)")
		})
	}
}
