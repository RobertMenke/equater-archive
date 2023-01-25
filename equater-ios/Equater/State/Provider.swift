//
//  Provider.swift
//  Equater
//
//  Created by Robert B. Menke on 1/19/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation
import Resolver

/// Handles naming/tracking/registering of various URLSessions
enum URLSessionIdentifier: String {
	case photoUploadSession
	case photoDownloadSession

	func getResolverName() -> Resolver.Name {
		Resolver.Name(rawValue)
	}

	func createIdentifier() -> String {
		"com.beauchampsullivan.Equater." + rawValue
	}

	func registerBackgroundProvider<T: URLSessionDelegate>(delegate: T.Type) {
		Resolver
			.register(URLSession.self, name: getResolverName()) {
				let configuration = URLSessionConfiguration.background(
					withIdentifier: self.createIdentifier()
				)

				return URLSession(
					configuration: configuration,
					delegate: Resolver.resolve(delegate),
					delegateQueue: nil
				)
			}
			.scope(.application)
	}
}

extension Resolver.Name {
	static let uploadSession = Self(URLSessionIdentifier.photoUploadSession.rawValue)
	static let downloadSession = Self(URLSessionIdentifier.photoDownloadSession.rawValue)
}
