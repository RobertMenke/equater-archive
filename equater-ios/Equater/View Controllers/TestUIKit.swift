//
//  TestUIKit.swift
//  Equater
//
//  Created by Robert B. Menke on 10/16/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Foundation
import SwiftUI

final class TestUIKit: UIViewControllerRepresentable {
	typealias UIViewControllerType = TestUIKitIntegrationViewController

	func makeUIViewController(context: UIViewControllerRepresentableContext<TestUIKit>) -> TestUIKit.UIViewControllerType {
		let storyboard = UIStoryboard(name: "TestUIKitIntegration", bundle: nil)
		let controller = storyboard.instantiateViewController(identifier: "TestUIKit")

		return controller as! TestUIKitIntegrationViewController
	}

	func updateUIViewController(_ uiViewController: TestUIKit.UIViewControllerType, context: UIViewControllerRepresentableContext<TestUIKit>) {
		print("Updating")
	}
}
