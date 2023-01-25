//
//  SnackbarPreview.swift
//  Equater
//
//  Created by Robert B. Menke on 5/4/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct SnackbarPreview: View {
	var body: some View {
		HStack {
			Spacer()
			VStack(alignment: .center, spacing: 10.0) {
				Spacer()

				ContainedButton(
					label: "Snackbar without action",
					enabled: true,
					size: .custom(width: 300.0, height: 64.0),
					isLoading: .constant(false)
				) {
					showSnackbar(message: "This is just a standard message")
				}

				ContainedButton(
					label: "Snackbar with action",
					enabled: true,
					size: .custom(width: 300.0, height: 64.0),
					isLoading: .constant(false)
				) {
					showSnackbar(
						message: "Press the action button",
						action: SnackbarAction(text: "Do It!") {
							showSnackbar(message: "Great job!")
						}
					)
				}
				Spacer()
			}
			.frame(minWidth: 0.0, maxWidth: 300.0, minHeight: 0.0, maxHeight: .infinity)

			Spacer()
		}
		.frameFillParent()
	}
}

struct SnackbarPreview_Previews: PreviewProvider {
	static var previews: some View {
		SnackbarPreview()
	}
}
