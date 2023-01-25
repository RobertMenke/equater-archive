//
//  photo.dto.swift
//  Equater
//
//  Created by Robert B. Menke on 1/23/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation

struct PreSignedUrlResponse: Decodable {
	let preSignedUrl: String?
}

struct PreSignedUploadUrlResponse: Codable {
	let preSignedUrl: String
}

struct PreSignedUrlRequest: Codable {
	let photoType: String
	let userId: UInt?
}

struct PhotoUploadStatusDto: Encodable {
	let profilePhotoUploadComplete: Bool
	let mimeType: String?
	let photoType: String
}
