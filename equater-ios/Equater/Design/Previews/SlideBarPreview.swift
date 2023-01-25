//
//  SlideBarPreview.swift
//  Equater
//
//  Created by Robert B. Menke on 10/20/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct SlideBarPreview: View {
	@State private var isLoading = false
	var body: some View {
		VStack(alignment: .center) {
			Spacer()
			SlideToConfirm(
				slideInstructionText: "Swipe to cancel agreement",
				slideCompletedText: "Canceled",
				isLoading: $isLoading,
				completion: { _ in
					isLoading = true
					DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
						Sound.applePay.play()
						isLoading = false
					}
				}
			)
			Spacer()
		}
		.frameFillParent()
		.padding([.leading, .trailing])
	}
}

struct SlideBarPreview_Previews: PreviewProvider {
	static var previews: some View {
		SlideBarPreview()
	}
}
