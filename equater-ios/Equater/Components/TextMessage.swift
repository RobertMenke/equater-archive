//
//  TextMessage.swift
//  Equater
//
//  Created by Robert B. Menke on 7/14/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import MessageUI
import SwiftUI

typealias TextMessageContext = UIViewControllerRepresentableContext<TextMessage>

struct TextMessage: UIViewControllerRepresentable {
	var number: String
	var onComplete: () -> Void

	func makeUIViewController(context: TextMessageContext) -> MFMessageComposeViewController {
		let controller = MFMessageComposeViewController()
		controller.messageComposeDelegate = context.coordinator
		controller.recipients = [number]
		controller.body = "Hey Equater support team, I'm having an issue with the app."

		return controller
	}

	func updateUIViewController(_ uiViewController: MFMessageComposeViewController, context: TextMessageContext) {}

	func makeCoordinator() -> Coordinator {
		Coordinator(self)
	}

	final class Coordinator: NSObject, MFMessageComposeViewControllerDelegate {
		let view: TextMessage

		init(_ view: TextMessage) {
			self.view = view
		}

		func messageComposeViewController(_ controller: MFMessageComposeViewController, didFinishWith result: MessageComposeResult) {
			print("Did finish \(result)")
			view.onComplete()
		}
	}
}
