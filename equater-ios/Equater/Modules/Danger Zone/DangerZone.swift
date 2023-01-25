//
//  DanzerZone.swift
//  Equater
//
//  Created by Robert B. Menke on 8/12/22.
//  Copyright © 2022 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct DangerZone: View {
	@State private var isLoading = false
	@InjectedObject private var authViewModel: AuthenticationViewModel
	@InjectedObject private var appState: AppState

	var body: some View {
		Window {
			VStack(alignment: .leading) {
				AppText("Permanently Delete Your Account", font: .custom(size: 20.0, color: .textPrimary))
					.bold()
					.padding(.top, 65)
					.padding(.bottom, 8)

				AppText("Delete your Equater account and all associated data. You CANNOT undo this action and you CANNOT recover your account. Think carefully before you proceed.", font: .custom(size: 15.0, color: .textSecondary))
					.lineSpacing(3)

				ContainedButton(
					label: "Permanently Delete Account",
					enabled: !isLoading,
					size: .custom(width: .infinity, height: 50.0),
					isLoading: $isLoading,
					backgroundColor: AppColor.redDecline,
					onTap: {
						let alertController = UIAlertController(title: "Are you sure?", message: "Deleting your account is permanent and cannot be undone. Please be certain this is what you want.", preferredStyle: .alert)

						alertController.addAction(UIAlertAction(title: "Delete Account", style: .default, handler: { (_: UIAlertAction!) in
							isLoading = true
							if let user = appState.user {
								authViewModel.permanentlyDeleteAccount(userId: user.id) {
									appState.signOut(resetCachedDependencies: true)
								}
							}
						}))

						alertController.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: { (_: UIAlertAction!) in
							alertController.dismiss(animated: true)
						}))

						if let viewController = UIApplication.shared.windows.first?.rootViewController {
							viewController.present(alertController, animated: true)
						}
					}
				)
				.padding(.top, 24)
			}
			.frameFillParent()
			.padding([.leading, .trailing], 14)
		}
		.offset(y: 1.0)
		.navigationTitle(Text("Danger Zone"))
	}
}

struct DangerZone_Previews: PreviewProvider {
	static var previews: some View {
		DangerZone()
	}
}
