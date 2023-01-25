//
//  AppState.swift
//
//  Created by Robert B. Menke on 9/7/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation
import Resolver
import SwiftEventBus
import SwiftUI
import UserNotifications

// MARK: - UserDefaults constants

let USER = "USER"
let USER_ACCOUNT = "USER_ACCOUNT"
let HAS_SEEN_WALKTHROUGH = "HAS_SEEN_WALKTHROUGH"
let AUTH_BEARER_TOKEN = "AUTH_BEARER_TOKEN"
let DEVICE_IS_REGISTERED_FOR_PUSH_NOTIFICATIONS = "DEVICE_IS_REGISTERED_FOR_PUSH_NOTIFICATIONS"
let FCM_TOKEN = "FCM_TOKEN"
let ENVIRONMENT_DETAILS = "ENVIRONMENT_DETAILS"

// MARK: - Global Notification State

let NOTIFICATION_BADGE_COUNT = "NOTIFICATION_BADGE_COUNT"

/// Prime refactoring candidate - will break apart when this becomes unwieldy
/// Do not inject other dependencies into AppState. Prefer instead posting events
/// to those dependencies via SwiftEventBus.
final class AppState: Identifiable, ObservableObject {
	@Injected private var vendorApi: VendorApi
	@Injected private var authApi: AuthenticationApi

	// MARK: - Observed Properties

	@Published var authToken: String? = nil
	@Published var user: User? = nil
	@Published var userAccounts: [UserAccount] = []
	@Published var fcmToken: String? = nil
	@Published var popularVendors: [Vendor] = []
	@Published var avatar: UIImage? = nil
	@Published var coverPhoto: UIImage? = nil
	@Published var showHomeScreenSheet = false
	@Published var environmentDetails: EnvironmentDetails? = nil
	@Published var shouldAuthWithFaceId = false
	@Published var plaidOAuthRedirectUri: URL? = nil
	private var pushNotificationAuthorizationStatus: UNAuthorizationStatus = .notDetermined
	private var socket: SocketListener?

	private var disposables = Set<AnyCancellable>()

	static let shared = AppState()

	// MARK: - Initializers

	private init() {
		user = AppState.decodeUserDefault(key: USER)
		userAccounts = AppState.decodeUserDefault(key: USER_ACCOUNT) ?? []
		authToken = UserDefaults.standard.string(forKey: AUTH_BEARER_TOKEN)
		setFcmTokenFromUserDefaults()
		environmentDetails = AppState.decodeUserDefault(key: ENVIRONMENT_DETAILS)
		refreshPushNotificationAuthorizationStatus()
	}

	// MARK: - Setters

	func set(authToken value: String?) {
		UserDefaults.standard.set(value, forKey: AUTH_BEARER_TOKEN)
		authToken = value
	}

	func set(signInResponse value: SignInResponse) {
		set(user: value.user)
		set(authToken: value.authToken)
		userAccounts = value.userAccounts
		SwiftEventBus.post(Event.userIsSignedIn.rawValue)
	}

	func set(user value: User?) {
		if let user = value {
			UserDefaults.standard.storeCodable(key: USER, item: user)
			logger.addAttribute(forKey: "userId", value: user.id)
		} else {
			logger.removeAttribute(forKey: "userId")
		}

		user = value
	}

	func set(userAccount value: UserAccount) {
		if userAccounts.first(where: { $0.id == value.id }) != nil {
			userAccounts = userAccounts.map {
				$0.id == value.id ? value : $0
			}
		} else {
			userAccounts.insert(value, at: 0)
		}
	}

	func set(userAccounts value: [UserAccount]) {
		userAccounts = value
	}

	func set(deviceIsRegistered value: Bool) {
		UserDefaults.standard.set(value, forKey: DEVICE_IS_REGISTERED_FOR_PUSH_NOTIFICATIONS)
	}

	func set(fcmToken token: String) {
		guard let user = user else { return }
		UserDefaults.standard.set(token, forKey: "\(user.id)-\(FCM_TOKEN)")
		fcmToken = token
	}

	func set(environment details: EnvironmentDetails) {
		if let currentDetails = environmentDetails, currentDetails != details {
			logger.warn("Signing out because the current environment is \(currentDetails.serverEnvironment) but the new environment is \(details.serverEnvironment)")
			signOut()
		}

		UserDefaults.standard.storeCodable(key: ENVIRONMENT_DETAILS, item: details)
		environmentDetails = details
	}

	func set(plaidRedirectUri: URL?) {
		plaidOAuthRedirectUri = plaidRedirectUri
	}

	// MARK: - Getters & computed properties

	func isSignedIn() -> Bool {
		authToken != nil
	}

	func canReceiveFunds() -> Bool {
		user?.canReceiveFunds ?? false
	}

	func shouldAttemptDeviceRegistrationOnLaunch() -> Bool {
		authToken != nil && fcmToken != nil && shouldAskUserToOptInToPushNotifications()
	}

	func getFcmToken() -> String? {
		fcmToken
	}

	func getEnvironmentDetails() -> EnvironmentDetails? {
		environmentDetails
	}

	func showPushNotificationPromptConditionally() {
		if !UIApplication.shared.isRegisteredForRemoteNotifications {
			showHomeScreenSheet = true
		}
	}

	func setFcmTokenFromUserDefaults() {
		if let user = user {
			fcmToken = UserDefaults.standard.string(forKey: "\(user.id)-\(FCM_TOKEN)")
		}
	}

	func findAccountRequiringUpdate() -> UserAccount? {
		guard let account = userAccounts.first(where: { $0.requiresPlaidReAuthentication }) else { return nil }
		guard account.getItemUpdateToken() != nil else { return nil }

		return account
	}

	func createSocketConnection() {
		guard let token = authToken else { return }
		socket = try? SocketListener.withAuthToken(authToken: token)
		socket?.createEventListeners()
	}

	/// Note: This information will be fetched from the server
	/// upon sign in once the user is signed out
	///
	/// In some cases, we don't want to reset Resolver's cached dependencies on sign out
	/// For example, when calling sign out from app delegate it can cause weird issues
	/// where components have an old reference to a cached dependency
	func signOut(resetCachedDependencies reset: Bool = false) {
		set(authToken: nil)
		set(user: nil)
		fcmToken = nil
		userAccounts = []
		avatar = nil
		coverPhoto = nil

		if reset {
			ResolverScope.cached.reset()
			ResolverScope.verificationCache.reset()
		}

		SwiftEventBus.post(Event.userIsSignedOut.rawValue)
		socket?.disconnect()
		shouldAuthWithFaceId = false
	}

	func findActiveAccount() -> UserAccount? {
		userAccounts.first(where: { $0.isActive })
	}

	func findActiveDepositoryAccounts() -> [UserAccount] {
		userAccounts.filter { $0.isActive && $0.accountType == "depository" }
	}

	func fetchPopularVendors() {
		let request = FetchPopularVendorsRequest()
		let response = vendorApi.getPopularVendors(request)

		response
			.catch { err -> Just<HttpResponse<VendorSearchResponse>> in
				debugPrint(err)
				return Just(HttpResponse<VendorSearchResponse>(
					status: 200,
					error: err.localizedDescription,
					body: VendorSearchResponse(
						vendors: []
					)
				))
			}
			.receive(on: DispatchQueue.main)
			.sink(receiveValue: { (response: HttpResponse<VendorSearchResponse>) in
				guard let body = response.body else { return }
				self.popularVendors = body.vendors
				// Not injecting this because there's a circular dependency issue
				let filePersistenceService: FilePersistenceService = Resolver.resolve()
				DispatchQueue.global(qos: .default).async {
					self.popularVendors.forEach {
						filePersistenceService.preCache(photo: .vendorLogo(vendor: $0))
					}
				}
			})
			.store(in: &disposables)
	}

	func fetchAvailableAccounts() {
		authApi
			.getUserAccounts()
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { completion in
					completion.log()
				},
				receiveValue: { (response: HttpResponse<[UserAccount]>) in
					guard let body = response.body else { return }
					self.userAccounts = body
					if let account = body.first(where: { $0.requiresPlaidReAuthentication }), account.getItemUpdateToken() != nil {
						self.showHomeScreenSheet = true
					}

					DispatchQueue.global(qos: .default).async {
						// Not injecting due to circular reference
						let filePersistenceService: FilePersistenceService = Resolver.resolve()
						self.userAccounts.forEach {
							filePersistenceService.preCache(photo: .plaidInstitution(institution: $0.institution))
						}
					}
				}
			)
			.store(in: &disposables)
	}

	func shouldAskUserToOptInToPushNotifications() -> Bool {
		pushNotificationAuthorizationStatus == .notDetermined
	}

	func refreshPushNotificationAuthorizationStatus() {
		UNUserNotificationCenter.current().getNotificationSettings { settings in
			self.pushNotificationAuthorizationStatus = settings.authorizationStatus
		}
	}

	/// Necessary when retrieving a Codable from UserDefaults
	private static func decodeUserDefault<T: Decodable>(key: String) -> T? {
		UserDefaults.standard.decodeUserDefault(key: key)
	}
}

extension UserDefaults {
	func storeCodable<T: Codable>(key: String, item: T) {
		let encoder = JSONEncoder()
		guard let encoded = try? encoder.encode(item) else {
			return
		}

		set(encoded, forKey: key)
	}

	/// Necessary when retrieving a Codable from UserDefaults
	func decodeUserDefault<T: Decodable>(key: String) -> T? {
		guard let savedItem = object(forKey: key) as? Data else {
			return nil
		}

		let decoder = JSONDecoder()
		guard let decodedItem = try? decoder.decode(T.self, from: savedItem) else {
			return nil
		}

		return decodedItem
	}
}
