//
//  PhotoUpload.swift
//  Equater
//
//  Created by Robert B. Menke on 1/4/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation
import Resolver

enum PreSignedUrlType {
	case upload
	case download
}

protocol PhotoUploadApi {
	func getPreSignedUrl(
		authToken: String,
		urlType: PreSignedUrlType,
		photo: Photo,
		forUser user: User?
	) -> AnyPublisher<HttpResponse<PreSignedUrlResponse>, AppError>

	func getPreSignedUploadUrl(
		authToken: String,
		photo: Photo
	) -> AnyPublisher<HttpResponse<PreSignedUploadUrlResponse>, AppError>

	func setPhotoUploadStatus(
		authToken: String,
		dto: PhotoUploadStatusDto
	) -> AnyPublisher<HttpResponse<User>, AppError>
}

struct PhotoUploadService: PhotoUploadApi {
	@Injected var session: URLSession

	func setPhotoUploadStatus(authToken: String, dto: PhotoUploadStatusDto) -> AnyPublisher<HttpResponse<User>, AppError> {
		let request = HttpRequest<PhotoUploadStatusDto, User>()

		return request.patch(apiEndpoint: .photoUploadStatus, requestDto: dto)
	}

	func getPreSignedUrl(
		authToken: String,
		urlType: PreSignedUrlType,
		photo: Photo,
		forUser user: User? = nil
	) -> AnyPublisher<HttpResponse<PreSignedUrlResponse>, AppError> {
		let dto = PreSignedUrlRequest(photoType: photo.getKeyName(), userId: user?.id)
		let request = HttpRequest<PreSignedUrlRequest, PreSignedUrlResponse>()

		return request.get(apiEndpoint: .preSignedPhotoDownloadUrl, requestDto: dto)
	}

	func getPreSignedUploadUrl(
		authToken: String,
		photo: Photo
	) -> AnyPublisher<HttpResponse<PreSignedUploadUrlResponse>, AppError> {
		let dto = PreSignedUrlRequest(photoType: photo.getKeyName(), userId: nil)
		let request = HttpRequest<PreSignedUrlRequest, PreSignedUploadUrlResponse>()

		return request.get(apiEndpoint: .preSignedPhotoUploadUrl, requestDto: dto)
	}
}
