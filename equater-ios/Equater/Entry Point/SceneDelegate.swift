//
//  SceneDelegate.swift
//  Equater
//
//  Created by Robert B. Menke on 8/18/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import GooglePlaces
import Resolver
import SwiftEventBus
import SwiftUI
import UIKit

private let TIME_INACTIVE_BEFORE_REFRESH_IN_SECONDS = 5

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
	@InjectedObject private var appState: AppState
	@Injected private var deepLinkHandler: DeepLinkHandler
	var window: UIWindow?
	private var resignedActiveAtTime: DispatchTime?

	func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
		// Use this method to optionally configure and attach the UIWindow `window` to the provided UIWindowScene `scene`.
		// If using a storyboard, the `window` property will automatically be initialized and attached to the scene.
		// This delegate does not imply the connecting scene or session are new (see `application:configurationForConnectingSceneSession` instead).

		// Use a UIHostingController as window root view controller
		if let windowScene = scene as? UIWindowScene {
			GMSPlacesClient.provideAPIKey(EnvironmentService.get(.googleApiKey))
			let window = UIWindow(windowScene: windowScene)
			let rootView = ContentView()

			window.rootViewController = UIHostingController(rootView: rootView)
			self.window = window
			window.makeKeyAndVisible()
		}

		if let userActivity = connectionOptions.userActivities.first {
			self.scene(scene, continue: userActivity)
		}
	}

	func sceneDidDisconnect(_ scene: UIScene) {
		// Called as the scene is being released by the system.
		// This occurs shortly after the scene enters the background, or when its session is discarded.
		// Release any resources associated with this scene that can be re-created the next time the scene connects.
		// The scene may re-connect later, as its session was not neccessarily discarded (see `application:didDiscardSceneSessions` instead).
	}

	func sceneDidBecomeActive(_ scene: UIScene) {
		// Called when the scene has moved from an inactive state to an active state.
		// Use this method to restart any tasks that were paused (or not yet started) when the scene was inactive.
		print("Scene became active")

		// In order to ensure we have the latest state, if the user has been away from the app
		// for more than a few seconds.
		// TODO: Consider using background notifications to keep the UI refreshed
		// TODO: if the app is already in the foreground our websocket connection will keep state up to date
		guard let startTime = resignedActiveAtTime else {
			return
		}

		let endTime = DispatchTime.now()
		let elapsedTime = (endTime.uptimeNanoseconds - startTime.uptimeNanoseconds) / 1_000_000_000

		if appState.user != nil, appState.isSignedIn(), elapsedTime > TIME_INACTIVE_BEFORE_REFRESH_IN_SECONDS {
			logger.console("Refreshing app state after re-entering foreground")
			SwiftEventBus.post(Event.userIsSignedIn.rawValue, sender: nil)
		}

		resignedActiveAtTime = nil
	}

	func sceneWillResignActive(_ scene: UIScene) {
		// Called when the scene will move from an active state to an inactive state.
		// This may occur due to temporary interruptions (ex. an incoming phone call).
		print("Scene resigned active")
		resignedActiveAtTime = DispatchTime.now()
	}

	func sceneWillEnterForeground(_ scene: UIScene) {
		// Called as the scene transitions from the background to the foreground.
		// Use this method to undo the changes made on entering the background.

		// Must re-initialize the haptic engine every time the app enters
		// the foreground
		HapticEngine.shared.initializeEngine()
		print("Entering foreground")
	}

	func sceneDidEnterBackground(_ scene: UIScene) {
		// Called as the scene transitions from the foreground to the background.
		// Use this method to save data, release shared resources, and store enough scene-specific state information
		// to restore the scene back to its current state.

		// Save changes in the application's managed object context when the application transitions to the background.
		(UIApplication.shared.delegate as? AppDelegate)?.saveContext()
		print("Entering background")
	}

	func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
		print(#function)
		// Get URL components from the incoming user activity
		guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
		      let incomingURL = userActivity.webpageURL,
		      let components = URLComponents(url: incomingURL, resolvingAgainstBaseURL: true)
		else {
			return
		}

		let path = components.path
		DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
			self.deepLinkHandler.navigate(usingPath: path, withRedirectUri: incomingURL)
		}
	}

	func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
		print(#function)
		if let url = URLContexts.first?.url {
			deepLinkHandler.navigate(usingPath: url.path, withRedirectUri: url)
		}
	}
}
