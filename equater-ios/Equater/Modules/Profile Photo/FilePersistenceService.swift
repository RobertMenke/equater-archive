//
//  FilePersistenceService.swift
//  Equater
//
//  Created by Robert B. Menke on 1/5/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import CryptoKit
import Foundation
import Resolver
import SwiftDate
import SwiftEventBus
import UIKit

/// Quick tutorial: https://programmingwithswift.com/save-images-locally-with-swift-5/
final class FilePersistenceService {
	@Injected var session: URLSession

	@Injected var appState: AppState

	@Injected var photoApi: PhotoUploadApi

	private var disposables = Set<AnyCancellable>()

	/// Retrieves the profile photo from whichever source is available and falls back to a default
	/// image if there is no photo. The callback API may seem awkward here but that's because this
	/// method always produces an image (default if not available yet) and then provides a 2nd update
	/// via the callback when the real image is ready.
	///
	/// - Parameters
	///     - whenAvailable: If we had to resort to downloading from a remote URL, the method will first return
	///                      the default profile image and then call *whenAvailable* when the download finishes
	func getPhotoOrFallbackToDefault(photo: Photo, whenAvailable handler: @escaping (UIImage) -> Void) {
		DispatchQueue.global(qos: .default).async {
			// Check if the photo exists on the file system
			if photo.existsLocally(), !photo.shouldInvalidateCache(), let image = photo.readLocalImage() {
				DispatchQueue.main.async {
					handler(image)
				}
			} else if self.appState.authToken != nil {
				self.downloadRemoteImage(photo: photo) { image in
					let finalImage = image ?? photo.getDefaultImage().uiImage
					DispatchQueue.main.async {
						handler(finalImage)
					}
				}
			} else {
				DispatchQueue.main.async {
					handler(photo.getDefaultImage().uiImage)
				}
			}
		}
	}

	/// Retrieve a specified photo and execute the handler callback if it's retrieved successfully
	func getPhoto(photo: Photo, whenAvailable handler: @escaping (UIImage) -> Void) {
		DispatchQueue.global(qos: .default).async {
			// Check if the photo exists on the file system
			if photo.existsLocally(), !photo.shouldInvalidateCache(), let image = photo.readLocalImage() {
				DispatchQueue.main.async {
					handler(image)
				}
			} else if self.appState.authToken != nil {
				logger.console("downloading auth token")
				self.downloadRemoteImage(photo: photo) { image in
					logger.console("Retrieving image from S3")
					guard let image = image else { return }
					DispatchQueue.main.async {
						handler(image)
					}
				}
			}
		}
	}

	func preCache(photo: Photo) {
		DispatchQueue.global(qos: .default).async {
			if (photo.existsLocally() && !photo.shouldInvalidateCache()) || self.appState.authToken == nil || photo.getHash() == nil {
				return
			}

			self.downloadRemoteImage(photo: photo) { image in
				guard image != nil else { return }
				logger.console("Pre-cached \(photo.toString())")
			}
		}
	}

	func downloadImage(fromLink link: String, whenReady: @escaping (UIImage?) -> Void) {
		guard let url = URL(string: link) else {
			whenReady(nil)
			return
		}

		let task = session.downloadTask(with: URLRequest(url: url)) { url, _, _ in
			guard let url = url, let image = url.readImage() else {
				whenReady(nil)
				return
			}

			whenReady(image)
		}

		task.resume()
	}

	/// Download a profile photo from a pre-signed url in the background
	///
	/// - Parameters
	///     - onComplete: receives a UIImage instance that has been downloaded and stored
	private func downloadRemoteImage(
		photo: Photo,
		onComplete handler: ((UIImage?) -> Void)? = nil
	) {
		if let preSignedUrl = photo.getRemoteUrl(), !self.urlIsExpired(preSignedUrl) {
			downloadImage(preSignedUrl, photo: photo, onComplete: handler)
			return
		}

		switch photo {
		case .avatar(let user):
			downloadUserPhoto(forUser: user, photo: photo)
		case .coverPhoto(let user):
			downloadUserPhoto(forUser: user, photo: photo)
		default:
			handler?(nil)
		}
	}

	private func downloadUserPhoto(
		forUser user: User,
		photo: Photo,
		onComplete handler: ((UIImage?) -> Void)? = nil
	) {
		guard let authToken = appState.authToken, user.profilePhotoUploadCompleted == true else {
			return
		}

		photoApi
			.getPreSignedUrl(authToken: authToken, urlType: .download, photo: photo, forUser: user)
			.compactMap(\.body)
			.map(\.preSignedUrl)
			.replaceNil(with: "")
			.filter { $0.count > 0 }
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { _ in
					logger.info("completed fetching presigned url")
				},
				receiveValue: { [weak self] url in
					guard self != nil else { return }
					// TODO: Update the user value stored in UserDefaults so that we don't repeatedly re-fetch
					// TODO: the presigned url
					self?.downloadImage(url, photo: photo, onComplete: handler)
				}
			)
			.store(in: &disposables)
	}

	private func downloadImage(
		_ url: String,
		photo: Photo,
		onComplete handler: ((UIImage?) -> Void)? = nil
	) {
		downloadImage(fromLink: url) { image in
			guard let image = image else {
				handler?(nil)
				return
			}

			try? photo.store(image: image)
			handler?(image)
		}
	}

	/// This expiration is specific to AWS
	private func urlIsExpired(_ urlString: String) -> Bool {
		guard let components = URLComponents(string: urlString) else {
			return true
		}

		guard let isoDate = components.queryItems?.first(where: { $0.name == "X-Amz-Date" })?.value else {
			return true
		}

		guard let expiration = components.queryItems?.first(where: { $0.name == "X-Amz-Expires" })?.value else {
			return true
		}

		guard let date = isoDate.toISODate(), let expirationInSeconds = Int(expiration) else {
			return true
		}

		let expirationDate = date.addingTimeInterval(expirationInSeconds.seconds.timeInterval)
		let currentDate = Date()

		return currentDate > expirationDate.date
	}
}
