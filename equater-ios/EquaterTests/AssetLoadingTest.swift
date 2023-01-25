//
//  AssetLoadingTest.swift
//  EquaterTests
//
//  Created by Robert B. Menke on 4/25/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

@testable import Equater
import XCTest

/// This probably isn't a great way to test this code, nor should I be using force unwraps in general,
/// however, I'm only force unwrapping assets loaded from xcassets and it's just too damn annoying
/// to have to defensively code for scenarios that will never fail given at least simple test cases
/// likes those in this class
class AssetLoadingTest: XCTestCase {
	override func setUpWithError() throws {
		createTestingDoubles()
	}

	override func tearDownWithError() throws {
		// Put teardown code here. This method is called after the invocation of each test method in the class.
	}

	func testPerformanceExample() throws {
		// This is an example of a performance test case.
		measure {
			// Put the code you want to measure the time of here.
		}
	}

	func testAppColorsShouldLoad() {
		XCTAssertNoThrow(
			AppColor.allCases.map(\.uiColor)
		)
	}
}
