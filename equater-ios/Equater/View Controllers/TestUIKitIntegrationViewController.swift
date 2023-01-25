//
//  TestUIKitIntegrationControllerViewController.swift
//  Equater
//
//  Created by Robert B. Menke on 10/16/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import UIKit

class TestUIKitIntegrationViewController: UIViewController {
	@IBAction func clickMe(_ sender: Any) {
		let controller = UIAlertController(
			title: "Aw ya",
			message: "I can still use UIKit",
			preferredStyle: .alert
		)

		controller.addAction(UIAlertAction(title: "Dismiss", style: .default, handler: { _ in
			controller.dismiss(animated: true, completion: {
				print("Action dismissed gone")
			})
		}))

		present(controller, animated: true, completion: {
			print("Completion")
		})
	}

	override func viewDidLoad() {
		super.viewDidLoad()
	}
}
