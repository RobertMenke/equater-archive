//
//  Data.swift
//  Equater
//
//  Created by Robert B. Menke on 9/8/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation

// MARK: - Encoder/decoder utilities

func decode<T>(_ data: Data) -> AnyPublisher<T, AppError> where T: Decodable {
	let decoder = JSONDecoder()
	decoder.dateDecodingStrategy = .secondsSince1970

	return Just(data)
		.decode(type: T.self, decoder: decoder)
		.mapError { error in
			AppError.parseError(error.localizedDescription)
		}
		.eraseToAnyPublisher()
}
