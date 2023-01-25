//
//  UserCard.swift
//  Equater
//
//  Created by Robert B. Menke on 1/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct UserCard: View {
	var user: User
	var onSelected: (User) -> Void
	@State private var shadow: CGFloat = 5.0
	@State private var backgroundColor = Color(UIColor.secondarySystemBackground)

	@State private var profileImage: UIImage? = nil

	var body: some View {
		Card {
			ProfilePhotoAvatar(user: self.user, image: self.$profileImage, onTap: {
				self.onSelected(self.user)
			})

			VStack(alignment: .leading, spacing: 4) {
				AppText("\(self.user.firstName) \(self.user.lastName)", font: .primaryText)
					.padding(.leading, 20)

				AppText(self.createSecondaryText(), font: .subText)
					.padding(.leading, 20)
					.font(.system(size: 12))
			}
		}
		.onTapGesture {
			self.onSelected(self.user)
		}
	}

	private func createSecondaryText() -> String {
		if let city = user.city, let state = user.state {
			return "\(city), \(state)"
		}

		do {
			let date = try Date.fromIso8601(user.dateTimeCreated)

			return "Joined \(date.formatMonthYear())"
		} catch let err {
			// Should never get here, but just in case respond with something friendly
			logger.error("\(err.localizedDescription)")
			return "A great and capable person"
		}
	}
}

struct UserRow_Previews: PreviewProvider {
	static var previews: some View {
		UserCard(user: userFake, onSelected: { user in
			print("Selected user with id: \(user.id) and email: \(user.email)")
		})
	}
}
