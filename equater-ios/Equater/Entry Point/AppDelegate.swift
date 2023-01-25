//
//  AppDelegate.swift
//  Equater
//
//  Created by Robert B. Menke on 8/18/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import CoreData
import Firebase
import FirebaseMessaging
import IQKeyboardManagerSwift
import Resolver
import SwiftEventBus
import UIKit
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
	@Injected private var deviceRegistrationService: DeviceRegistrationService
	@Injected private var fileApi: FilePersistenceService
	@InjectedObject private var profileViewModel: ProfileViewModel
	@InjectedObject private var appState: AppState
	@InjectedObject private var userSearchViewModel: UserSearchViewModel
	@InjectedObject private var vendorSearchViewModel: VendorViewModel
	@InjectedObject private var manageExpensesViewModel: AgreementsViewModel
	@InjectedObject private var transactionViewModel: TransactionViewModel
	@InjectedObject private var verificationViewModel: VerifiedCustomerViewModel
	@InjectedObject private var authViewModel: AuthenticationViewModel
	@InjectedObject private var homeScreenViewModel: HomeScreenViewModel
	@InjectedObject private var agreementViewModel: AgreementsViewModel
	@Injected private var deepLinkHandler: DeepLinkHandler

	func application(
		_ application: UIApplication,
		didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
	) -> Bool {
		FirebaseApp.configure()
		Messaging.messaging().delegate = self
		UNUserNotificationCenter.current().delegate = self

		// Fetch details about the environment (will trigger sign out if changing server environments)
		DispatchQueue.global(qos: .default).async {
			self.authViewModel.fetchEnvironment(self.appState.set(environment:))
		}

		SwiftEventBus.onBackgroundThread(self, name: Event.userIsSignedIn.rawValue) { _ in
			self.onAuthenticationConfirmed()
		}

		SwiftEventBus.onBackgroundThread(self, name: Event.userIsSignedOut.rawValue) { _ in
			self.onSignOutConfirmed()
		}

		if appState.isSignedIn(), let user = appState.user {
			appState.shouldAuthWithFaceId = true
			logger.addAttribute(forKey: "userId", value: user.id)
		} else {
			appState.signOut(resetCachedDependencies: false)
		}

		// We want to use the default navigation bar during the sign in flow and then style it for the home screen
		// once the user is signed in
		styleNavigationBar()

		// Initialize IQ Keyboard (provides keyboard avoiding behavior for views)
		IQKeyboardManager.shared.enable = true
		IQKeyboardManager.shared.shouldShowToolbarPlaceholder = false
		IQKeyboardManager.shared.shouldResignOnTouchOutside = true

		return true
	}

	// MARK: Authenticated Set Up

	/// Handle any data fetching or global set up. This will always be called from a background
	/// thread so be sure to publish changes on the main queue
	func onAuthenticationConfirmed() {
		appState.fetchAvailableAccounts()
		appState.fetchPopularVendors()
		manageExpensesViewModel.fetchSharedExpenses {
			/// If you're signing in (not registering), have shared expenses in any state, and are not registered
			/// for push notifications, prompt the user to accept push notifications again.
			if self.manageExpensesViewModel.sharedExpenses.count > 0, self.appState.shouldAskUserToOptInToPushNotifications() {
				self.appState.showHomeScreenSheet = true
			}
		}
		transactionViewModel.fetchTransactions()
		userSearchViewModel.fetchRelationships()
		ResolverScope.authScope.reset()
		appState.createSocketConnection()
		if let user = appState.user {
			if user.canReceiveFunds {
				profileViewModel.getUserBalance()
			}
			DispatchQueue.main.async {
				self.verificationViewModel.set(user: user)
				self.appState.setFcmTokenFromUserDefaults()
			}

			fileApi.getPhoto(photo: .avatar(user: user), whenAvailable: { image in
				self.appState.avatar = image
				self.profileViewModel.avatar = image
			})

			fileApi.getPhoto(photo: .coverPhoto(user: user), whenAvailable: { image in
				self.appState.coverPhoto = image
				self.profileViewModel.coverImage = image
			})

			logger.info("Confirmed authentication and set up application for user id \(user.id)")
		}
	}

	/// AppDelegate can hold on to old versions of cached dependencies
	/// make sure to re-resolve cached objects that have been injected
	/// via resolver
	func onSignOutConfirmed() {
		userSearchViewModel = Resolver.resolve(UserSearchViewModel.self)
		vendorSearchViewModel = Resolver.resolve(VendorViewModel.self)
		profileViewModel = Resolver.resolve(ProfileViewModel.self)
		verificationViewModel = Resolver.resolve(VerifiedCustomerViewModel.self)
	}

	// MARK: UISceneSession Lifecycle

	func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
		// Called when a new scene session is being created.
		// Use this method to select a configuration to create the new scene with.
		UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
	}

	func application(_ application: UIApplication, didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
		// Called when the user discards a scene session.
		// If any sessions were discarded while the application was not running, this will be called shortly after application:didFinishLaunchingWithOptions.
		// Use this method to release any resources that were specific to the discarded scenes, as they will not return.
	}

	func application(
		_ application: UIApplication,
		continue userActivity: NSUserActivity,
		restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
	) -> Bool {
		// Get URL components from the incoming user activity
		guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
		      let incomingURL = userActivity.webpageURL,
		      let components = URLComponents(url: incomingURL, resolvingAgainstBaseURL: true)
		else {
			return false
		}

		let path = components.path
		deepLinkHandler.navigate(usingPath: path, withRedirectUri: incomingURL)

		return true
	}

	func application(
		_ application: UIApplication,
		didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
	) {
		Messaging.messaging().apnsToken = deviceToken
		let tokenParts = deviceToken.map { data in String(format: "%02.2hhx", data) }
		let token = tokenParts.joined()
		logger.console("Device Token: \(token)")
	}

	func application(
		_ application: UIApplication,
		didFailToRegisterForRemoteNotificationsWithError error: Error
	) {
		logger.console("Failed to register: \(error)")
	}

	// MARK: - URLSession Background Handler

	/// Publishes an event out to the application that a background event
	func application(
		_ application: UIApplication,
		handleEventsForBackgroundURLSession identifier: String,
		completionHandler: @escaping () -> Void
	) {
		SwiftEventBus.post(identifier, sender: completionHandler)
	}

	// MARK: - Core Data stack

	lazy var persistentContainer: NSPersistentContainer = {
		/*
		  The persistent container for the application. This implementation
		  creates and returns a container, having loaded the store for the
		  application to it. This property is optional since there are legitimate
		  error conditions that could cause the creation of the store to fail.
		 */
		let container = NSPersistentContainer(name: "Equater")
		container.loadPersistentStores(completionHandler: { _, error in
			if let error = error as NSError? {
				// Replace this implementation with code to handle the error appropriately.
				// fatalError() causes the application to generate a crash log and terminate. You should not use this function in a shipping application, although it may be useful during development.

				/*
				 Typical reasons for an error here include:
				 * The parent directory does not exist, cannot be created, or disallows writing.
				 * The persistent store is not accessible, due to permissions or data protection when the device is locked.
				 * The device is out of space.
				 * The store could not be migrated to the current model version.
				 Check the error message to determine what the actual problem was.
				 */
				//                fatalError("Unresolved error \(error), \(error.userInfo)")
			}
		})
		return container
	}()

	// MARK: - Core Data Saving support

	func saveContext() {
		let context = persistentContainer.viewContext
		if context.hasChanges {
			do {
				try context.save()
			} catch {
				// Replace this implementation with code to handle the error appropriately.
				// fatalError() causes the application to generate a crash log and terminate. You should not use this function in a shipping application, although it may be useful during development.
				let nserror = error as NSError
				logger.error("\(nserror.localizedDescription)")
				//                fatalError("Unresolved error \(nserror), \(nserror.userInfo)")
			}
		}
	}
}

// MARK: - Push Notifications

extension AppDelegate {
	func registerForPushNotifications() {
		let notificationCenter = UNUserNotificationCenter.current()
		let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]

		notificationCenter.requestAuthorization(options: authOptions) { granted, _ in
			logger.console("Push Notification Permission Granted: \(granted)")
			notificationCenter.getNotificationSettings { settings in
				DispatchQueue.main.async {
					self.appState.showHomeScreenSheet = false
					self.appState.refreshPushNotificationAuthorizationStatus()
				}

				guard settings.authorizationStatus == .authorized else { return }

				DispatchQueue.main.async {
					UIApplication.shared.registerForRemoteNotifications()
				}
			}
		}
	}
}

// MARK: - Notification Center Delegate

extension AppDelegate: UNUserNotificationCenterDelegate {
	// Receive displayed notifications for iOS 10 devices.
	func userNotificationCenter(
		_ center: UNUserNotificationCenter,
		willPresent notification: UNNotification,
		withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
	) {
		let userInfo = notification.request.content.userInfo

		// With swizzling disabled you must let Messaging know about the message, for Analytics
		// Messaging.messaging().appDidReceiveMessage(userInfo)
		// Print message ID.
		if let messageID = userInfo[EnvironmentService.get(.gcmMessageKeyId)] {
			logger.console("Message ID: \(messageID)")
		}

		if userInfo["incrementInviteCounter"] != nil {
			var currentCounter = UserDefaults.standard.integer(forKey: NOTIFICATION_BADGE_COUNT)
			currentCounter += 1
			UIApplication.shared.applicationIconBadgeNumber = currentCounter
			UserDefaults.standard.set(currentCounter, forKey: NOTIFICATION_BADGE_COUNT)
		}
		logger.console("\(userInfo)")

		// Change this to your preferred presentation option
		completionHandler([.alert, .sound, .badge])
	}

	/// The server will always send out a category with a push notification
	/// In all cases other than .notification, the app should navigate to a particular
	/// section in the app
	func userNotificationCenter(
		_ center: UNUserNotificationCenter,
		didReceive response: UNNotificationResponse,
		withCompletionHandler completionHandler: @escaping () -> Void
	) {
		deepLinkHandler.navigate(usingNotification: response, completionHandler: completionHandler)
	}
}

// [END ios_10_message_handling]

extension AppDelegate: MessagingDelegate {
	/// This is called any time firebase provides a new registration token
	/// This can occur when:
	///     - The app is restored on a new device
	///     - The user uninstalls/reinstall the app
	///     - The user clears app data.
	///
	/// 1 important detail is that the token may be refreshed in cases where the user hasn't enabled
	/// remote notifications yet.
	func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String) {
		logger.console("Firebase registration token: \(fcmToken)")
		let dataDict: [String: String] = ["token": fcmToken]
		NotificationCenter.default.post(name: Notification.Name("FCMToken"), object: nil, userInfo: dataDict)
		let existingToken = appState.getFcmToken()
		if existingToken != fcmToken {
			guard appState.isSignedIn() else {
				let reference = NSObject()
				SwiftEventBus.onBackgroundThread(reference, name: Event.userIsSignedIn.rawValue) { _ in
					self.deviceRegistrationService.registerDeviceInBackground(withFcmToken: fcmToken)
					SwiftEventBus.unregister(reference)
				}
				return
			}

			deviceRegistrationService.registerDeviceInBackground(withFcmToken: fcmToken)
		}
	}
}

// MARK: - Style Navigation Bar

extension AppDelegate {
	func styleNavigationBar() {
		let navAppearance = UINavigationBarAppearance()
		navAppearance.configureWithOpaqueBackground()
		navAppearance.backgroundColor = AppColor.backgroundPrimary.uiColor
		navAppearance.shadowColor = .clear

		let font = AppFont.title.getUIFont()

		let attrs: [NSAttributedString.Key: Any] = [
			.foregroundColor: AppColor.textPrimary.uiColor,
			.font: font.bold(),
		]

		navAppearance.largeTitleTextAttributes = attrs

		let barButtonItemAppearance = UIBarButtonItemAppearance(style: .plain)
		barButtonItemAppearance.normal.titleTextAttributes = [.foregroundColor: AppColor.accentPrimaryForText.uiColor]
		navAppearance.backButtonAppearance = barButtonItemAppearance
		navAppearance.buttonAppearance = barButtonItemAppearance
		navAppearance.doneButtonAppearance = barButtonItemAppearance

		let image = UIImage(systemName: "chevron.backward")?.withTintColor(AppColor.accentPrimaryForText.uiColor, renderingMode: .alwaysOriginal) // fix indicator color
		navAppearance.setBackIndicatorImage(image, transitionMaskImage: image)

		let proxy = UINavigationBar.appearance()
		UINavigationBar.appearance().tintColor = AppColor.accentPrimaryForText.uiColor
		proxy.tintColor = AppColor.accentPrimaryForText.uiColor
		proxy.standardAppearance = navAppearance
		proxy.scrollEdgeAppearance = navAppearance
		proxy.compactAppearance = navAppearance

		if #available(iOS 15.0, *) {
			proxy.compactScrollEdgeAppearance = navAppearance
		}
	}
}
