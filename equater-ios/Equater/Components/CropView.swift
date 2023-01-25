//
//  CropView.swift
//  Equater
//
//  Created by Robert B. Menke on 1/5/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import CropViewController
import Foundation
import SwiftUI

/// See: https://github.com/TimOliver/TOCropViewController
struct CropView: UIViewControllerRepresentable {
	@Binding var image: UIImage?
	@Binding var visible: Bool
	var onComplete: (UIImage) -> Void

	func makeUIViewController(context: UIViewControllerRepresentableContext<CropView>) -> CropViewController {
		let cropController = CropViewController(croppingStyle: .circular, image: image!)
		cropController.delegate = context.coordinator

		return cropController
	}

	func updateUIViewController(_ uiViewController: CropViewController, context: UIViewControllerRepresentableContext<CropView>) {}

	func makeCoordinator() -> CropView.Coordinator {
		Coordinator(self)
	}

	class Coordinator: NSObject, CropViewControllerDelegate {
		private let cropView: CropView

		init(_ cropView: CropView) {
			self.cropView = cropView
		}

		public func cropViewController(_ cropViewController: CropViewController, didCropToImage image: UIImage, withRect cropRect: CGRect, angle: Int) {
			cropView.visible = false
			cropView.image = image
			cropView.onComplete(image)
			cropViewController.dismiss(animated: true, completion: nil)
		}

		public func cropViewController(_ cropViewController: CropViewController, didCropToCircularImage image: UIImage, withRect cropRect: CGRect, angle: Int) {
			cropView.visible = false
			cropView.image = image
			cropView.onComplete(image)
			cropViewController.dismiss(animated: true, completion: nil)
		}
	}
}
