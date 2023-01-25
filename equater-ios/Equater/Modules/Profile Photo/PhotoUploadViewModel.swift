//
//  PhotoUploadViewModel.swift
//  Equater
//
//  Created by Robert B. Menke on 1/4/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation
import Resolver
import SwiftEventBus
import UIKit

struct PhotoUploadContext {
	let task: URLSessionUploadTask
	let preSignedUploadUrlResponse: PreSignedUploadUrlResponse
	let photo: Photo
	let user: User
	let mimeType: String
	let completionHandler: (User?, Error?) -> Void
}

final class PhotoUploadViewModel: NSObject, Identifiable, ObservableObject {
	@Injected
	var uploadService: PhotoUploadApi

	@Injected
	var appState: AppState

	@LazyInjected(name: .uploadSession)
	var backgroundSession: URLSession

	@Injected
	var fileService: FilePersistenceService

	@Published
	var coverPhoto: UIImage?

	@Published
	var avatarPhoto: UIImage?

	private var disposables = Set<AnyCancellable>()
	private var backgroundCompletionHandler: (() -> Void)?
	private static var taskMap: [Int: PhotoUploadContext] = Dictionary()

	override init() {
		super.init()
		SwiftEventBus.onBackgroundThread(
			self,
			name: URLSessionIdentifier.photoUploadSession.rawValue,
			handler: { notification in
				guard let handler = notification?.object as? () -> Void else {
					return
				}

				self.backgroundCompletionHandler = handler
			}
		)
	}

	/// When the save button is selected attempt to upload the avatar photo and cover
	/// photo if a selection was made. We make these updates sequentially to avoid a race condition
	/// on the server when updates are applied simultaneously.
	func persistImageUpdates(completion: @escaping (Photo?, Error?) -> Void) {
		guard let user = appState.user else { return }
		if let avatarPhoto = avatarPhoto {
			persistAvatarPhotoUpdate(avatarPhoto: avatarPhoto, user: user) { photo, err in
				completion(photo, err)
				if let coverPhoto = self.coverPhoto {
					self.persistCoverPhotoUpdate(coverPhoto: coverPhoto, user: user) { photo, error in
						completion(photo, error)
					}
				}
			}
		} else if let coverPhoto = coverPhoto {
			persistCoverPhotoUpdate(coverPhoto: coverPhoto, user: user) { photo, error in
				completion(photo, error)
			}
		}
	}

	private func persistCoverPhotoUpdate(coverPhoto: UIImage, user: User, completion: @escaping (Photo?, Error?) -> Void) {
		let photo = Photo.coverPhoto(user: user)
		uploadImage(image: coverPhoto, photo: photo) { updatedUser, error in
			if let error = error {
				completion(nil, error)
				return
			}

			guard let updatedUser = updatedUser, let coverPhoto = updatedUser.getCoverPhoto() else { return }
			self.fileService.getPhotoOrFallbackToDefault(photo: coverPhoto, whenAvailable: {
				self.appState.coverPhoto = $0
			})
			completion(coverPhoto, nil)
		}
	}

	private func persistAvatarPhotoUpdate(avatarPhoto: UIImage, user: User, completion: @escaping (Photo?, Error?) -> Void) {
		let photo = Photo.avatar(user: user)
		uploadImage(image: avatarPhoto, photo: photo) { updatedUser, error in
			if let error = error {
				completion(nil, error)
				return
			}

			guard let updatedUser = updatedUser, let avatarPhoto = updatedUser.getProfilePhoto() else { return }
			self.fileService.getPhotoOrFallbackToDefault(photo: avatarPhoto, whenAvailable: {
				self.appState.avatar = $0
			})
			completion(avatarPhoto, nil)
		}
	}

	/// Note that setting currentImage will not take effect until the next re-render
	private func uploadImage(
		image: UIImage,
		photo: Photo,
		completion: @escaping (User?, Error?) -> Void
	) {
		DispatchQueue.global(qos: .default).async {
			guard let data = image.pngData(), let user = self.appState.user else { return }

			self.uploadPhoto(image: data, user: user, photo: photo, onCompletion: completion)
		}
	}

	/// This method is modeled after
	/// https://github.com/awsdocs/aws-mobile-developer-guide/blob/master/doc_source/how-to-ios-s3-presigned-urls.rst
	func uploadPhoto(
		image: Data,
		user: User,
		photo: Photo,
		onCompletion: @escaping (User?, Error?) -> Void
	) {
		guard let token = appState.authToken else {
			onCompletion(nil, AppError.unauthenticated("Auth token is nil"))
			return
		}

		let keyName = photo.isUserAvatar() ? "avatar_\(user.uuid)" : "cover_photo_\(user.uuid)"
		guard let fileUrl = try? image.createTemporaryStorageFile(keyName: keyName) else {
			onCompletion(nil, AppError.unauthenticated("Unable to save photo"))
			return
		}

		uploadService
			.getPreSignedUploadUrl(authToken: token, photo: photo)
			.compactMap(\.body)
			.compactMap { (dto: PreSignedUploadUrlResponse) -> PhotoUploadContext? in
				guard let url = URL(string: dto.preSignedUrl) else {
					return nil
				}
				var request = URLRequest(url: url)
				request.cachePolicy = .reloadIgnoringLocalCacheData
				request.httpMethod = HttpRequestMethod.put.rawValue
				request.setValue(Photo.getContentType(image), forHTTPHeaderField: "Content-Type")

				return PhotoUploadContext(
					task: self.backgroundSession.uploadTask(with: request, fromFile: fileUrl),
					preSignedUploadUrlResponse: dto,
					photo: photo,
					user: user,
					mimeType: Photo.getContentType(image),
					completionHandler: onCompletion
				)
			}
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { _ in
					logger.console("Finished fetching presigned upload url")
				},
				receiveValue: { [weak self] (context: PhotoUploadContext) in
					guard self != nil else { return }
					Self.taskMap[context.task.taskIdentifier] = context
					context.task.resume()
				}
			)
			.store(in: &disposables)
	}

	private func setUploadStatus(_ context: PhotoUploadContext, error: Error?, completion: @escaping (User?) -> Void) {
		let success = error == nil
		guard let authToken = appState.authToken else {
			return
		}

		let dto = PhotoUploadStatusDto(
			profilePhotoUploadComplete: success,
			mimeType: context.mimeType,
			photoType: context.photo.getKeyName()
		)

		uploadService
			.setPhotoUploadStatus(authToken: authToken, dto: dto)
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { [weak self] status in
					guard self != nil else { return }
					switch status {
					case .failure(let err):
						logger.error("Error posting photo status", error: err)
						completion(nil)
					case .finished:
						return
					}
				},
				receiveValue: { [weak self] response in
					guard self != nil, let user = response.body else { return }
					completion(user)
				}
			)
			.store(in: &disposables)
	}
}

/// Example taken from here
/// https://williamboles.me/keeping-things-going-when-the-user-leaves-with-urlsession-and-background-transfers/
extension PhotoUploadViewModel: URLSessionTaskDelegate {
	func urlSession(
		_ session: URLSession,
		task: URLSessionTask,
		didCompleteWithError error: Error?
	) {
		DispatchQueue.main.async {
			logger.console("Background photo upload finished")
			if let context = Self.taskMap[task.taskIdentifier] {
				self.setUploadStatus(context, error: nil) { user in
					guard let user = user else {
						context.completionHandler(nil, AppError.networkError("Uploaded photo but failed to update Equater's server"))
						return
					}
					self.appState.set(user: user)
					context.completionHandler(user, nil)
				}
				Self.taskMap.removeValue(forKey: task.taskIdentifier)
			}

			self.backgroundCompletionHandler?()
			self.backgroundCompletionHandler = nil
		}
	}
}
