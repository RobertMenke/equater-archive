//
//  SelectedEmailCard.swift
//  Equater
//
//  Created by Robert B. Menke on 5/30/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct SelectedEmailCard: View {
	var email: String
	var onRemovalRequested: (String) -> Void

	var body: some View {
		ZStack {
			Avatar
			CloseIcon
			MailIcon
		}
		.frame(
			minWidth: 0,
			maxWidth: 100,
			minHeight: 45,
			maxHeight: 45,
			alignment: Alignment.leading
		)
	}

	var CloseIcon: some View {
		HStack {
			AppImage.closeIconColorFilled.image
				.resizable()
				.aspectRatio(contentMode: .fit)
				.frame(width: 36, height: 36, alignment: .center)
				.position(x: 5, y: 5)
		}
		.onTapGesture {
			self.onRemovalRequested(self.email)
		}
	}

	var MailIcon: some View {
		HStack {
			AppImage.addMail.image
				.resizable()
				.aspectRatio(contentMode: .fit)
				.frame(width: 24, height: 24, alignment: .center)
				.position(x: 62, y: 34)
		}
	}

	var Avatar: some View {
		VStack {
			UserInviteAvatar(email: self.email)
		}
		.frame(
			minWidth: 0,
			maxWidth: 60,
			minHeight: 60,
			maxHeight: 60,
			alignment: Alignment.leading
		)
		.padding(2)
		.cornerRadius(8.0)
		.shadow(radius: 2.0)
	}
}

struct SelectedEmailCard_Previews: PreviewProvider {
	static var previews: some View {
		SelectedEmailCard(email: "robert@equater.io") { email in
			print("Removal requested for \(email)")
		}
	}
}
