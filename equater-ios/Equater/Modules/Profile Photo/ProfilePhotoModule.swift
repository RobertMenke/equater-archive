//
//  ProfilePhotoModule.swift
//  Equater
//
//  Created by Robert B. Menke on 1/18/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation
import Resolver

extension Resolver {
	static func registerProfilePhotoModule() {
		Resolver
			.register { FilePersistenceService() }
			.scope(.cached)

		Resolver
			.register { PhotoUploadViewModel() }
			.scope(.cached)

		Resolver
			.register { PhotoUploadService() }
			.implements(PhotoUploadApi.self)
			.scope(.application)
	}
}
