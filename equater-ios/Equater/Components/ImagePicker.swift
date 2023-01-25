//
//  ImagePicker.swift
//  Equater
//
//  Created by Robert B. Menke on 1/4/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct ImagePicker: UIViewControllerRepresentable {
	@Environment(\.presentationMode) var presentationMode
	@Binding var image: UIImage?
	var isTakingPhoto: Bool
	var onImageSelected: ((UIImage?) -> Void)?

	func makeUIViewController(context: UIViewControllerRepresentableContext<ImagePicker>) -> UIImagePickerController {
		let picker = UIImagePickerController()
		picker.delegate = context.coordinator

		if isTakingPhoto {
			picker.sourceType = .camera
		}

		return picker
	}

	func updateUIViewController(
		_ uiViewController: UIImagePickerController,
		context: UIViewControllerRepresentableContext<ImagePicker>
	) {}

	func makeCoordinator() -> ImagePicker.Coordinator {
		Coordinator(self)
	}

	final class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
		let parent: ImagePicker

		init(_ parent: ImagePicker) {
			self.parent = parent
		}

		func imagePickerController(
			_ picker: UIImagePickerController,
			didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
		) {
			if let uiImage = info[.originalImage] as? UIImage {
				parent.image = uiImage
				parent.onImageSelected?(uiImage)
			} else {
				parent.onImageSelected?(nil)
			}
		}

		func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
			parent.onImageSelected?(nil)
		}
	}
}
