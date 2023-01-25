//
//  ButtonPreview.swift
//  Equater
//
//  Created by Robert B. Menke on 5/9/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct ButtonPreview: View {
	let plusIcon = AppImage.add24pt.getUiImage(withColor: .textPrimary)
	@State var loading = false

	var body: some View {
		ScrollView(.vertical) {
			VStack {
				VStack(alignment: .leading, spacing: 10.0) {
					ContainedButton(label: "Done", enabled: true, size: .small, isLoading: .constant(false)) {}
					ContainedButton(label: "Loading", enabled: true, size: .medium, isLoading: $loading) {
						self.loading = !self.loading
						DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
							self.loading = !self.loading
						}
					}
					ContainedButton(label: "Click Me", enabled: true, size: .large, image: plusIcon, isLoading: .constant(false)) {}

					OutlinedButton(label: "Done", enabled: true, size: .small, isLoading: .constant(false)) {}
					OutlinedButton(label: "Submit", enabled: true, size: .medium, isLoading: .constant(false)) {}
					OutlinedButton(label: "Click Me", enabled: true, size: .large, isLoading: .constant(false)) {}

					TextButton(label: "Done", enabled: true, size: .small, isLoading: .constant(false)) {}
					TextButton(label: "Submit", enabled: true, size: .medium, isLoading: .constant(false)) {}
					TextButton(label: "Click Me", enabled: true, size: .large, isLoading: .constant(false)) {}
				}
				.padding(16.0)
				// Disabled buttons
				VStack(alignment: .leading, spacing: 10.0) {
					ContainedButton(label: "Click Me", enabled: false, size: .medium, isLoading: .constant(false)) {}
					OutlinedButton(label: "Submit", enabled: false, size: .medium, isLoading: .constant(false)) {}
					TextButton(label: "Submit", enabled: false, size: .medium, isLoading: .constant(false)) {}
				}
			}
			.frameFillParent()
		}
	}
}

struct ButtonPreview_Previews: PreviewProvider {
	static var previews: some View {
		ButtonPreview()
	}
}
