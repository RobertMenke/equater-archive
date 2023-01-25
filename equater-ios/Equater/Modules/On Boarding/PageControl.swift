//
//  PageControl.swift
//  Equater
//
//  Created by Robert B. Menke on 9/2/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct PageControl: UIViewRepresentable {
	var numberOfPages: Int
	@Binding var currentStep: Int

	func makeCoordinator() -> Coordinator {
		Coordinator(self)
	}

	func makeUIView(context: Context) -> UIPageControl {
		let control = UIPageControl()
		control.numberOfPages = numberOfPages
		control.addTarget(
			context.coordinator,
			action: #selector(Coordinator.updateCurrentPage(sender:)),
			for: .valueChanged
		)

		// TODO: Figure out how to dynamically obtain the size of a UIPageControl dot
		let defaultColor = UIImage.outlinedEllipse(
			size: CGSize(width: 7.0, height: 7.0),
			color: AppColor.inverseBackgroundSecondary.uiColor
		)

		if let defaultColor = defaultColor {
			control.pageIndicatorTintColor = UIColor(patternImage: defaultColor)
		}

		control.currentPageIndicatorTintColor = AppColor.inverseBackgroundSecondary.uiColor

		return control
	}

	func updateUIView(_ uiView: UIPageControl, context: Context) {
		uiView.currentPage = currentStep
	}

	final class Coordinator: NSObject {
		var control: PageControl

		init(_ control: PageControl) {
			self.control = control
		}

		@objc func updateCurrentPage(sender: UIPageControl) {
			control.currentStep = sender.currentPage
		}
	}
}

struct PageControl_Previews: PreviewProvider {
	static var previews: some View {
		PageControl(
			numberOfPages: 3,
			currentStep: .constant(1)
		)
	}
}
