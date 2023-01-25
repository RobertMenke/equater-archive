//
//  URL.swift
//  Equater
//
//  Created by Robert B. Menke on 12/14/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import Foundation
import UIKit

extension URL {
	/// Loads a profile photo into memory and maps the data to a UIImage instance
	func readImage() -> UIImage? {
		guard let data = FileManager.default.contents(atPath: path) else {
			logger.console("No data at path")
			return nil
		}

		guard let image = UIImage(data: data) else {
			logger.console("Couldn't create image from data")
			return nil
		}

		return image
	}
}
