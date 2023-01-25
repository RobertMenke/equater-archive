//
//  AppButton.swift
//  Equater
//
//  Created by Robert B. Menke on 5/2/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import MaterialComponents.MaterialButtons
import MaterialComponents.MaterialButtons_Theming
import SwiftUI

typealias ButtonContext = UIViewRepresentableContext<AppButton>

enum ButtonType {
	case text
	case outlined
	case contained
}

enum ButtonSize {
	case small
	case medium
	case large
	case custom(width: CGFloat, height: CGFloat)

	func getCgSize() -> CGSize {
		switch self {
		case .small:
			return CGSize(width: 80.0, height: 36.0)
		case .medium:
			return CGSize(width: 100.0, height: 48.0)
		case .large:
			return CGSize(width: 152.0, height: 56.0)
		case .custom(let width, let height):
			return CGSize(width: width, height: height)
		}
	}
}

struct ContainedButton: View {
	var label: String
	var enabled: Bool
	let size: ButtonSize
	let alignment: Alignment = .leading
	var image: UIImage?
	@Binding var isLoading: Bool
	var styleButton: ((MDCButton) -> Void)?
	var backgroundColor: AppColor?
	var textColor: AppColor?
	let onTap: () -> Void

	var body: some View {
		let buttonSize = size.getCgSize()

		return AppButton(
			label: label,
			enabled: enabled,
			type: .contained,
			size: size,
			image: image,
			isLoading: $isLoading,
			styleButton: styleButton,
			backgroundColor: backgroundColor,
			textColor: textColor,
			onTap: onTap
		)
		.frame(
			minWidth: 0,
			maxWidth: buttonSize.width,
			minHeight: 0,
			maxHeight: buttonSize.height,
			alignment: alignment
		)
	}
}

struct OutlinedButton: View {
	var label: String
	var enabled: Bool
	let size: ButtonSize
	let alignment: Alignment = .leading
	var image: UIImage?
	@Binding var isLoading: Bool
	var styleButton: ((MDCButton) -> Void)?
	var backgroundColor: AppColor?
	var textColor: AppColor?
	let onTap: () -> Void

	var body: some View {
		let buttonSize = size.getCgSize()

		return AppButton(
			label: label,
			enabled: enabled,
			type: .outlined,
			size: size,
			image: image,
			isLoading: $isLoading,
			styleButton: styleButton,
			backgroundColor: backgroundColor,
			textColor: textColor,
			onTap: onTap
		)
		.frame(
			minWidth: 0,
			maxWidth: buttonSize.width,
			minHeight: 0,
			maxHeight: buttonSize.height,
			alignment: alignment
		)
	}
}

struct TextButton: View {
	var label: String
	var enabled: Bool
	let size: ButtonSize
	var alignment: Alignment = .leading
	var image: UIImage?
	@Binding var isLoading: Bool
	var styleButton: ((MDCButton) -> Void)?
	var backgroundColor: AppColor?
	var textColor: AppColor?
	let onTap: () -> Void

	var body: some View {
		let buttonSize = size.getCgSize()

		return AppButton(
			label: label,
			enabled: enabled,
			type: .text,
			size: size,
			image: image,
			isLoading: $isLoading,
			styleButton: styleButton,
			backgroundColor: backgroundColor,
			textColor: textColor,
			onTap: onTap
		)
		.frame(
			minWidth: 0,
			maxWidth: buttonSize.width,
			minHeight: 0,
			maxHeight: buttonSize.height,
			alignment: alignment
		)
	}
}

// MARK: - AppButton

/// This can be used directly, but should generally be thought of as an internal implementation
struct AppButton: UIViewRepresentable {
	var label: String
	var enabled: Bool
	var type: ButtonType
	var size: ButtonSize
	var image: UIImage?
	@Binding var isLoading: Bool
	var styleButton: ((MDCButton) -> Void)?
	var backgroundColor: AppColor?
	var textColor: AppColor?
	var onTap: () -> Void

	@State var spinner: UIActivityIndicatorView?

	func makeUIView(context: ButtonContext) -> MDCButton {
		let button = MDCButton()
		button.isUppercaseTitle = false
		button.setTitle(label, for: .normal)
		button.accessibilityLabel = label
		button.minimumSize = size.getCgSize()
		button.maximumSize = size.getCgSize()

		if let image = image {
			button.setImage(image, for: .normal)
		}

		applyTheme(toButton: button)

		let width = size.getCgSize().width
		if width >= ButtonSize.large.getCgSize().width {
			button.setTitleFont(AppFont.buttonLarge.getUIFont(), for: .normal)
		} else if width >= ButtonSize.medium.getCgSize().width {
			button.setTitleFont(AppFont.buttonMedium.getUIFont(), for: .normal)
		} else {
			button.setTitleFont(AppFont.buttonSmall.getUIFont(), for: .normal)
		}

		button.addTarget(
			context.coordinator,
			action: #selector(context.coordinator.onTap(_:)),
			for: .touchUpInside
		)

		styleButton?(button)

		if let background = backgroundColor {
			button.backgroundColor = background.uiColor
		}

		if let textColor = textColor {
			button.setTitleColor(textColor.uiColor, for: .normal)
		}

		return button
	}

	func updateUIView(_ button: MDCButton, context: ButtonContext) {
		button.isEnabled = enabled
		if isLoading {
			button.setTitle(nil, for: .normal)
			addSpinner(button)
		} else {
			removeSpinner(button)
			button.setTitle(label, for: .normal)
		}

		if let background = backgroundColor {
			button.backgroundColor = background.uiColor
		}

		if let textColor = textColor {
			button.setTitleColor(textColor.uiColor, for: .normal)
		}
	}

	func makeCoordinator() -> Coordinator {
		Coordinator(self)
	}

	private func addSpinner(_ button: MDCButton) {
		guard button.findViews(subclassOf: UIActivityIndicatorView.self).count == 0 else { return }
		let spinner = UIActivityIndicatorView(style: .medium)
		spinner.translatesAutoresizingMaskIntoConstraints = false
		spinner.startAnimating()
		button.addSubview(spinner)
		spinner.centerXAnchor.constraint(equalTo: button.centerXAnchor).isActive = true
		spinner.centerYAnchor.constraint(equalTo: button.centerYAnchor).isActive = true
	}

	private func removeSpinner(_ button: MDCButton) {
		let spinners = button.findViews(subclassOf: UIActivityIndicatorView.self)

		spinners.forEach {
			$0.removeFromSuperview()
		}
	}

	private func makeLabel() -> UILabel {
		let label = UILabel()
		label.text = self.label

		switch type {
		case .contained:
			label.tintColor = UIColor.white
		case .outlined, .text:
			label.tintColor = AppColor.textPrimary.uiColor
		}

		return label
	}

	private func applyTheme(toButton button: MDCButton) {
		switch type {
		case .text:
			button.applyTextTheme(withScheme: globalMaterialTheme)
			button.setTitleColor(AppColor.textPrimary.uiColor, for: .disabled)
		case .outlined:
			button.applyOutlinedTheme(withScheme: globalMaterialTheme)
			button.setTitleColor(AppColor.textPrimary.uiColor, for: .normal)
			button.setBorderColor(AppColor.accentPrimary.uiColor, for: .normal)
			button.setTitleColor(AppColor.inverseBackgroundSecondary.uiColor, for: .disabled)
			button.setBorderColor(AppColor.inverseBackgroundSecondary.uiColor, for: .disabled)
		case .contained:
			button.applyContainedTheme(withScheme: globalMaterialTheme)
			button.setTitleColor(AppColor.textPrimary.uiColor, for: .disabled)
			button.setBackgroundColor(AppColor.backgroundSecondary.uiColor, for: .disabled)
		}
	}

	class Coordinator: NSObject {
		private let button: AppButton

		init(_ button: AppButton) {
			self.button = button
		}

		@objc func onTap(_ button: MDCButton) {
			if !self.button.isLoading {
				self.button.onTap()
			}
		}
	}
}

// MARK: - Preview

struct AppButton_Previews: PreviewProvider {
	static var previews: some View {
		Window {
			VStack(alignment: .leading, spacing: 10.0) {
				ContainedButton(label: "Done", enabled: true, size: .small, isLoading: .constant(false)) {}
				ContainedButton(label: "Click Me", enabled: true, size: .medium, isLoading: .constant(false)) {}
				ContainedButton(label: "Click Me", enabled: true, size: .large, image: AppImage.plusIcon.getUiImage(withColor: .textPrimary), isLoading: .constant(false)) {}

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
	}
}
