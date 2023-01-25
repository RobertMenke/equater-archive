//
//  Data.swift
//  Equater
//
//  Created by Robert B. Menke on 1/6/22.
//  Copyright © 2022 beauchampsullivan. All rights reserved.
//

import Foundation

extension Data {
	func createTemporaryStorageFile(keyName: String) throws -> URL {
		let temporaryDirectoryURL = URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true)
		let temporaryFileUrl = temporaryDirectoryURL.appendingPathComponent(keyName)

		try write(to: temporaryFileUrl)

		return temporaryFileUrl
	}
}
