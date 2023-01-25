//
//  EnableNotifications.swift
//  Equater
//
//  Created by Robert B. Menke on 7/20/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct EnableNotifications: View {
	@InjectedObject private var appState: AppState
	var onComplete: (Bool) -> Void

	var body: some View {
		Window {
			VStack(alignment: .center) {
				Spacer()

				AppImage
					.bell
					.image
					.resizable()
					.frameFillWidth(height: nil)
					.aspectRatio(contentMode: .fit)

				AppText("Enable Notifications", font: .title)
				AppText("We’d like to send you push notifications related to your expenses", font: .subtitle)
					.multilineTextAlignment(.leading)
					.lineSpacing(3)
					.offset(y: 3)

				ContainedButton(
					label: "Enable Notifications",
					enabled: true,
					size: .custom(width: .infinity, height: 50),
					isLoading: .constant(false),
					onTap: {
						if let delegate = UIApplication.shared.delegate as? AppDelegate {
							delegate.registerForPushNotifications()
							onComplete(true)
						}
					}
				)
				.padding(.top, 8)

				TextButton(
					label: "No Thanks",
					enabled: true,
					size: .large,
					isLoading: .constant(false),
					onTap: {
						self.appState.showHomeScreenSheet = false
						onComplete(false)
					}
				)

				Spacer()
			}
			.frameFillParent()
			.padding(15)
		}
	}
}

struct EnableNotifications_Previews: PreviewProvider {
	static var previews: some View {
		EnableNotifications { _ in
		}
	}
}
