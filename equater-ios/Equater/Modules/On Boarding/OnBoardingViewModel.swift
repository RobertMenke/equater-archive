//
//  OnBoardingViewModel.swift
//  Equater
//
//  Created by Robert B. Menke on 1/18/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation
import Resolver
import SwiftEventBus

final class OnBoardingViewModel: Identifiable, ObservableObject {
	@InjectedObject private var appState: AppState
	@Injected private var api: OnBoardingApi

	private static let HAS_SEEN_ON_BOARDING = "has_seen_on_boarding"
	@Published var hasSeenOnBoarding = true

	private static let HAS_SEEN_NOTIFICATION_PROMPT = "has_seen_notification_prompt"
	@Published var hasSeenNotificationPrompt = false

	/// We want to show the confetti animation if they made it to the on-boarding screen
	/// after going through the registration process, not if they made it to on-boarding on the
	/// initial app launch because they never skipped on-boarding
	@Published var showConfettiAnimation = false

	/// If the user already made it to the migration screen, don't exit from the screen when we detect
	/// shared expenses. Better for them to skip on-boarding then for the app to yank the screen away.
	@Published var madeItToMigrationScreen = false
	private var disposables = Set<AnyCancellable>()

	init() {
		SwiftEventBus.onMainThread(self, name: Event.userIsSignedIn.rawValue) { _ in
			if let user = self.appState.user {
				let onBoardingKey = Self.HAS_SEEN_ON_BOARDING + "_\(user.id)"
				self.hasSeenOnBoarding = UserDefaults.standard.bool(forKey: onBoardingKey)

				let notificationKey = Self.HAS_SEEN_NOTIFICATION_PROMPT + "_\(user.id)"
				self.hasSeenNotificationPrompt = UserDefaults.standard.bool(forKey: notificationKey)
			}
		}

		SwiftEventBus.onMainThread(self, name: Event.userIsSignedOut.rawValue) { _ in
			self.hasSeenOnBoarding = true
			self.hasSeenNotificationPrompt = false
		}
	}

	func set(hasSeenOnBoarding: Bool) {
		if let user = appState.user {
			let key = Self.HAS_SEEN_ON_BOARDING + "_\(user.id)"
			UserDefaults.standard.setValue(hasSeenOnBoarding, forKey: key)
			self.hasSeenOnBoarding = hasSeenOnBoarding
		}
	}

	func set(hasSeenNotificationPrompt: Bool) {
		if let user = appState.user {
			let key = Self.HAS_SEEN_NOTIFICATION_PROMPT + "_\(user.id)"
			UserDefaults.standard.setValue(hasSeenNotificationPrompt, forKey: key)
			self.hasSeenNotificationPrompt = hasSeenNotificationPrompt
		}
	}

	/// This is a fire & forget operation. We don't care if it succeeds or fails.
	func sendFeedback(_ dto: OnBoardingFeedback) {
		DispatchQueue.global(qos: .default).async {
			self.api
				.sendFeedback(dto)
				.receive(on: DispatchQueue.main)
				.sink(
					receiveCompletion: { [weak self] value in
						guard self != nil else { return }
						switch value {
						case .failure(let err):
							logger.error("\(err.localizedDescription)")
						default:
							break
						}
					},
					receiveValue: { [weak self] response in
						guard self != nil else { return }
						if let body = response.body {
							self?.appState.set(user: body)
						}
					}
				)
				.store(in: &self.disposables)
		}
	}
}
