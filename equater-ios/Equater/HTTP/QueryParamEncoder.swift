//
//  QueryParamEncoder.swift
//  Equater
//
//  Created by Robert B. Menke on 1/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import DictionaryCoding
import Foundation

struct QueryParamEncoder {
	func encode<T: Encodable>(_ item: T) throws -> String {
		let encoder = DictionaryEncoder()
		let encoded: [String: Any] = try encoder.encode(item)
		let queryParams = encodeDictionary(encoded)

		return "?\(queryParams)"
	}

	private func encodeDictionary(_ dictionary: [String: Any]) -> String {
		dictionary
			.compactMap { key, value -> String? in
				if value is [String: Any] {
					if let dictionary = value as? [String: Any] {
						return encodeDictionary(dictionary)
					}
				} else {
					if let stringValue = value as? String,
					   let encodedValue = stringValue.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed)
					{
						return "\(key)=\(encodedValue)"
					}

					return "\(key)=\(value)"
				}

				return nil
			}
			.joined(separator: "&")
	}
}
