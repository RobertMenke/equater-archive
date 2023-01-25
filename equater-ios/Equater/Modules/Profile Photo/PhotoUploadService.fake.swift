//
//  PhotoUploadService.fake.swift
//  Equater
//
//  Created by Robert B. Menke on 4/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation

class PhotoUploadServiceFake: RestApiFake, PhotoUploadApi {
	/// Note: This should be reset to false on the setup of every test case
	static var requestShouldFail = false

	func getPreSignedUrl(authToken: String, urlType: PreSignedUrlType, photo: Photo, forUser: User?) -> AnyPublisher<HttpResponse<PreSignedUrlResponse>, AppError> {
		if PhotoUploadServiceFake.requestShouldFail {
			return makeFailingRequest(error: AppError.networkError("Request failed"))
		}

		return makeRequest(response: PreSignedUrlResponse(preSignedUrl: "https://google.com"))
	}

	func setPhotoUploadStatus(authToken: String, dto: PhotoUploadStatusDto) -> AnyPublisher<HttpResponse<User>, AppError> {
		if PhotoUploadServiceFake.requestShouldFail {
			return makeFailingRequest(error: AppError.networkError("Request failed"))
		}

		return makeRequest(response: userFake)
	}

	func getPreSignedUploadUrl(
		authToken: String,
		photo: Photo
	) -> AnyPublisher<HttpResponse<PreSignedUploadUrlResponse>, AppError> {
		if PhotoUploadServiceFake.requestShouldFail {
			return makeFailingRequest(error: AppError.networkError("Request failed"))
		}

		return makeRequest(response: PreSignedUploadUrlResponse(preSignedUrl: "https://google.com"))
	}
}
