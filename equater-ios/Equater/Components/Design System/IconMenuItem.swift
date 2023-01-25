//
//  ActionSheetRow.swift
//  Equater
//
//  Created by Robert B. Menke on 5/3/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import MaterialComponents.MaterialRipple
import SwiftUI

struct MenuItem: View {
	let icon: AppImage
	let text: String
	var trailingImage: UIImage?
	var height: CGFloat = 60
	let onTap: () -> Void

	var body: some View {
		IconMenuItem(icon: icon, text: text, trailingImage: trailingImage, onTap: onTap)
			.frame(
				minWidth: 0,
				maxWidth: .infinity,
				minHeight: height,
				maxHeight: height,
				alignment: Alignment.leading
			)
			// There seems to be a bug in iOS 15 that this redundant background modifier for some
			// weird reason fixes. This can likely be removed at a future date.
			.background(AppColor.backgroundPrimary.color)
	}
}

private typealias RowContext = UIViewRepresentableContext<IconMenuItem>

private struct IconMenuItem: UIViewRepresentable {
	let icon: AppImage
	let text: String
	var trailingImage: UIImage?
	let onTap: () -> Void

	func makeUIView(context: RowContext) -> MDCButton {
		let row = MDCButton(frame: CGRect(x: 0, y: 0, width: .greatestFiniteMagnitude, height: 60.0))

		row.backgroundColor = AppColor.backgroundPrimary.uiColor
		row.inkColor = AppColor.backgroundSecondary.uiColor

		let icon = makeImage(constrainedToParentView: row)
		_ = makeLabel(constrainedToIcon: icon)

		if let trailingImage = trailingImage {
			_ = makeTrailingImage(uiImage: trailingImage, constrainedToParentView: row)
		}

		row.addTarget(
			context.coordinator,
			action: #selector(context.coordinator.handleTap(_:)),
			for: .touchUpInside
		)

		return row
	}

	/// Nothing to do here
	func updateUIView(_ uiView: MDCButton, context: RowContext) {}

	func makeCoordinator() -> Coordinator {
		Coordinator(self)
	}

	private func makeImage(constrainedToParentView view: UIView) -> UIImageView {
		let image = UIImageView(image: icon.uiImage)
		image.contentMode = .scaleAspectFit
		view.addSubview(image)
		image.translatesAutoresizingMaskIntoConstraints = false
		image.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 15.0).isActive = true
		image.heightAnchor.constraint(equalToConstant: 24.0).isActive = true
		image.centerYAnchor.constraint(equalTo: view.centerYAnchor).isActive = true
		image.heightAnchor.constraint(equalToConstant: 40).isActive = true
		image.widthAnchor.constraint(equalToConstant: 40).isActive = true

		return image
	}

	private func makeTrailingImage(uiImage: UIImage, constrainedToParentView view: UIView) -> UIImageView {
		let image = UIImageView(image: uiImage)
		image.contentMode = .scaleAspectFit
		view.addSubview(image)
		image.translatesAutoresizingMaskIntoConstraints = false
		image.leadingAnchor.constraint(equalTo: view.trailingAnchor, constant: 15.0).isActive = true
		image.heightAnchor.constraint(equalToConstant: 24.0).isActive = true
		image.centerYAnchor.constraint(equalTo: view.centerYAnchor).isActive = true
		image.heightAnchor.constraint(equalToConstant: 40).isActive = true
		image.widthAnchor.constraint(equalToConstant: 40).isActive = true

		return image
	}

	private func makeLabel(constrainedToIcon view: UIView) -> UILabel {
		let label = UILabel()
		label.text = text
		label.tintColor = AppColor.textPrimary.uiColor
		label.font = AppFont.primaryText.getUIFont()
		view.addSubview(label)
		label.translatesAutoresizingMaskIntoConstraints = false
		label.leadingAnchor.constraint(equalTo: view.trailingAnchor, constant: 5).isActive = true
		label.centerYAnchor.constraint(equalTo: view.centerYAnchor).isActive = true

		return label
	}

	final class Coordinator: NSObject {
		private let row: IconMenuItem

		init(_ row: IconMenuItem) {
			self.row = row
		}

		@objc func handleTap(_ sender: UIButton) {
			HapticEngine.shared.play(.buttonTap)
			row.onTap()
		}
	}
}

struct ActionSheetRow_Previews: PreviewProvider {
	static var previews: some View {
		IconMenuItem(icon: .closeIconColorFilled, text: "Stuff") {
			print("Stuff tapped")
		}
	}
}
