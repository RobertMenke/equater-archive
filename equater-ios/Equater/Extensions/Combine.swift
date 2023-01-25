//
//  Combine.swift
//  Equater
//
//  Created by Robert B. Menke on 10/31/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation

extension Subscribers.Completion where Failure == AppError {
	func log() {
		switch self {
		case .failure(let err):
			logger.error("\(err.localizedDescription)", error: err)
		case .finished:
			break
		}
	}
}
