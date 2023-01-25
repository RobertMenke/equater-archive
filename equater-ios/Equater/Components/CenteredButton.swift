//
//  CenteredButton.swift
//  Equater
//
//  Created by Robert B. Menke on 9/2/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct CenteredButton: View {
	var text: String
	var action: () -> Void

	var body: some View {
		Button(
			action: action,
			label: {
				Text(text)
					.foregroundColor(.white)
					.frame(width: 200, height: 30, alignment: .center)
					.padding()
					.background(Color.blue)
			}
		)
		.cornerRadius(8)
	}
}

struct CenteredButton_Previews: PreviewProvider {
	static var previews: some View {
		CenteredButton(
			text: "Click Me",
			action: { print("Tapped") }
		)
	}
}
