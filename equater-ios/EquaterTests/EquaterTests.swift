//
//  EquaterTests.swift
//  EquaterTests
//
//  Created by Robert B. Menke on 8/18/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Combine
@testable import Equater
import Resolver
import XCTest

class EquaterTests: XCTestCase {
	private var api: AuthenticationApi!
	private var disposables = Set<AnyCancellable>()

	override func setUp() {
		createTestingDoubles()
		api = Resolver.resolve(AuthenticationApi.self)
	}

	override func tearDown() {
		resetTestingState()
	}

	/// This is a contrived example just meant to test that DI with test fakes is set up properly
	/// Once there are more good examples of tests in this codebase remove this example.
	func testExample() {
		let expectation = XCTestExpectation(description: "Sign in should work")
		let response = api.signIn(AuthenticationDto(email: "test", password: "test"))

		response.sink(
			receiveCompletion: { completion in
				switch completion {
				case .failure:
					XCTFail("Request did not succeed")
				case .finished:
					expectation.fulfill()
				}
			},
			receiveValue: { httpResponse in
				if let body = httpResponse.body {
					print(body)
				}

				XCTAssertTrue(httpResponse.body?.user.email == userFake.email)
			}
		)
		.store(in: &disposables)

		wait(for: [expectation], timeout: 2.0)
	}

	func testPerformanceExample() {
		// This is an example of a performance test case.
		measure {
			// Put the code you want to measure the time of here.
		}
	}
}
