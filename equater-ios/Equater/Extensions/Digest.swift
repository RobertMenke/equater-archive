//
//  Digest.swift
//  Equater
//
//  Created by Robert B. Menke on 1/19/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import CryptoKit
import Foundation

extension Digest {
	var bytes: [UInt8] { Array(makeIterator()) }
	var data: Data { Data(bytes) }

	var hexValue: String {
		bytes.map { String(format: "%02X", $0) }.joined()
	}
}
