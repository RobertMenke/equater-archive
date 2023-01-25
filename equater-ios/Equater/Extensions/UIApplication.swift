//
//  UIApplication.swift
//  Equater
//
//  Created by Robert B. Menke on 10/14/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Foundation
import SwiftUI
import UIKit

extension UIApplication {
	func endEditing() {
		sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
	}

	func endEditing(_ force: Bool) {
		windows
			.filter(\.isKeyWindow)
			.first?
			.endEditing(force)
	}
}

struct ResignKeyboardOnDragGesture: ViewModifier {
	var gesture = DragGesture().onChanged { _ in
		UIApplication.shared.endEditing(true)
	}

	func body(content: Content) -> some View {
		content.gesture(gesture)
	}
}
