//
//  SettingsView.swift
//  Equater
//
//  Created by Robert B. Menke on 8/9/22.
//  Copyright © 2022 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

private enum SettingsDestination: String {
	case profile
	case identityVerification
	case linkedAccounts
	case dangerZone
	case support
	case legal
}

struct SettingsView: View {
	@InjectedObject private var appState: AppState
	@InjectedObject private var homeScreenViewModel: HomeScreenViewModel
	var user: User
	@State private var navigationTag: String? = nil

	var body: some View {
		GeometryReader { (geo: GeometryProxy) in
			VStack {
				self.makeProfileSection(geo)

				ScrollView {
					VStack(spacing: 0.0) {
						ListHeader(text: "ABOUT YOU")
						SettingsRow(appImage: .profile, title: "Profile") {
							self.navigationTag = SettingsDestination.profile.rawValue
						}

						SettingsRow(appImage: .verificationCheck, title: "Identity Verification") {
							self.navigationTag = SettingsDestination.identityVerification.rawValue
						}

						ListHeader(text: "ACCOUNT")

						SettingsRow(appImage: .cardSuccess, title: "Linked Accounts") {
							self.navigationTag = SettingsDestination.linkedAccounts.rawValue
						}

						SettingsRow(appImage: .heartbeat, title: "Danger Zone") {
							self.navigationTag = SettingsDestination.dangerZone.rawValue
						}

						ListHeader(text: "EQUATER")

						SettingsRow(appImage: .callSupport, title: "Support") {
							self.navigationTag = SettingsDestination.support.rawValue
						}

						SettingsRow(appImage: .privacy, title: "Legal") {
							self.navigationTag = SettingsDestination.legal.rawValue
						}
					}

					NavigationLink(
						destination: Profile(user: self.user, showFormInstructions: false) {
							showSnackbar(message: "Profile updated!")
						},
						tag: SettingsDestination.profile.rawValue,
						selection: self.$navigationTag,
						label: { EmptyView() }
					)
					.hidden()

					NavigationLink(
						destination: VerifiedCustomerForm {
							print("Form updated")
						},
						tag: SettingsDestination.identityVerification.rawValue,
						selection: self.$navigationTag,
						label: { EmptyView() }
					)
					.hidden()

					NavigationLink(
						destination: LinkedAccountsView(),
						tag: SettingsDestination.linkedAccounts.rawValue,
						selection: self.$navigationTag,
						label: { EmptyView() }
					)
					.hidden()

					NavigationLink(
						destination: DangerZone(),
						tag: SettingsDestination.dangerZone.rawValue,
						selection: $navigationTag,
						label: { EmptyView() }
					)
					.hidden()

					NavigationLink(
						destination: Support(),
						tag: SettingsDestination.support.rawValue,
						selection: $navigationTag,
						label: { EmptyView() }
					)
					.hidden()

					NavigationLink(
						destination: Legal(),
						tag: SettingsDestination.legal.rawValue,
						selection: $navigationTag,
						label: { EmptyView() }
					)
					.hidden()
				}
			}
		}
	}

	/// Top section containing a profile picture
	private func makeProfileSection(_ geo: GeometryProxy) -> some View {
		HStack(alignment: .bottom) {
			VStack(alignment: .center, spacing: 8) {
				ProfilePhotoAvatar(user: user, image: self.$appState.avatar, size: .custom(width: 70, height: 70))

				AppText("\(user.firstName) \(user.lastName)", font: .primaryText)
			}
			.frame(maxWidth: .infinity, alignment: .center)
			.offset(y: 10.0)
		}
		.edgesIgnoringSafeArea(.all)
		.frame(maxHeight: geo.size.height / 6, alignment: .center)
	}

	private func SettingsRow(appImage: AppImage, title: String, onTap: @escaping () -> Void) -> some View {
		Row(onTap: onTap) {
			appImage.image
				.resizable()
				.aspectRatio(contentMode: .fit)
				.frame(height: 30)

			VStack(alignment: .leading) {
				AppText(title, font: .primaryText)
					.padding(.leading, 20)
			}
			.frameFillWidth(height: nil, alignment: .leading)

			Spacer()

			Image(systemName: "chevron.right")
				.font(.system(size: 16.0, weight: .bold))
				.foregroundColor(AppColor.textPrimary.color)
		}
	}
}
