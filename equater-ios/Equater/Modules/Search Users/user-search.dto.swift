//
//  user-search.dto.swift
//  Equater
//
//  Created by Robert B. Menke on 1/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation

struct UserSearchResponse: Decodable {
	let friends: [User]
	let users: [User]
}

struct UserSearchRequest: Encodable {
	let searchTerm: String
}
