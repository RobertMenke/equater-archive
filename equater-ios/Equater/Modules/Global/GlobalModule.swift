//
//  GlobalModule.swift
//  Equater
//
//  Created by Robert B. Menke on 1/18/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation
import Resolver
import WebKit

extension Resolver {
	static func registerGlobalModule() {
		Resolver
			.register { AppState.shared }
			.scope(.application)

		Resolver
			.register { EnvironmentService() }
			.scope(.application)

		Resolver
			.register { DeviceRegistrationService() }
			.implements(DeviceRegistrationApi.self)
			.scope(.unique)

		Resolver
			.register { URLSession.shared }
			.scope(.application)

		Resolver
			.register { DeepLinkHandler() }
			.scope(.unique)

		Resolver
			.register { TermsWebView() }
			.scope(.application)

		Resolver
			.register { PrivacyWebView() }
			.scope(.application)

		URLSessionIdentifier.photoUploadSession.registerBackgroundProvider(delegate: PhotoUploadViewModel.self)

		// Delay resolving these dependencies until resolver has a chance to build
		// the dependency graph
		DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
			// Load the web views immediately
			let _: TermsWebView = Resolver.resolve()
			let _: PrivacyWebView = Resolver.resolve()
		}
	}
}
