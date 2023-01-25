//
//  PlaidRestApiFake.swift
//  Equater
//
//  Created by Robert B. Menke on 4/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Foundation

struct PlaidRestServiceFake: RestApiFake, PlaidRestApi {
	/// Note: This should be reset to false on the setup of every test case
	static var requestShouldFail = false

	func storePlaidToken(dto: PlaidLinkResponse, authToken: String) -> AnyPublisher<HttpResponse<EmptyResponse>, AppError> {}
}
