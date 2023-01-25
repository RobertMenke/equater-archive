//
//  DismissingKeyboard.swift
//  Equater
//
//  Created by Robert B. Menke on 10/14/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Foundation
import SwiftUI

struct DismissingKeyboard: ViewModifier {
	func body(content: Content) -> some View {
		content
			.onTapGesture {
				let keyWindow = UIApplication
					.shared
					.connectedScenes
					.filter { $0.activationState == .foregroundActive }
					.map { $0 as? UIWindowScene }
					.compactMap { $0 }
					.first?
					.windows
					.filter(\.isKeyWindow)
					.first

				keyWindow?.endEditing(true)
			}
	}
}
