//
//  VisualEffect.swift
//  Equater
//
//  Created by Robert B. Menke on 5/2/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI
import UIKit

struct VisualEffectView: UIViewRepresentable {
	var effect: UIVisualEffect?
	var cornerRadius: CGFloat = 0.0

	func makeUIView(context: UIViewRepresentableContext<Self>) -> UIVisualEffectView {
		UIVisualEffectView()
	}

	func updateUIView(_ uiView: UIVisualEffectView, context: UIViewRepresentableContext<Self>) {
		uiView.effect = effect
		uiView.layer.cornerRadius = cornerRadius
		uiView.layer.masksToBounds = true
	}
}
