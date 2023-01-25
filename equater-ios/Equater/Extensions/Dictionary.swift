//
//  Dictionary.swift
//  Equater
//
//  Created by Robert B. Menke on 6/19/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation

/// Taken from https://stackoverflow.com/a/47844020/4313362
func encodeDictionary<Key: Encodable, Value: Encodable>(_ dictionary: [Key: Value]) -> String? {
	guard let object = try? JSONSerialization.data(withJSONObject: dictionary, options: .prettyPrinted) else {
		return nil
	}

	guard let json = String(data: object, encoding: .utf8) else {
		return nil
	}

	return json
}
