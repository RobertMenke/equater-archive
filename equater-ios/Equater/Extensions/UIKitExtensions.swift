//
//  UIKitExtensions.swift
//  Equater
//
//  Created by Robert B. Menke on 9/2/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Foundation
import UIKit

/// An extension to `UIImage` for creating images with shapes.
extension UIImage {
	/// Creates a circular outline image.
	class func outlinedEllipse(size: CGSize, color: UIColor, lineWidth: CGFloat = 1.0) -> UIImage? {
		UIGraphicsBeginImageContextWithOptions(size, false, 0.0)
		guard let context = UIGraphicsGetCurrentContext() else {
			return nil
		}

		context.setStrokeColor(color.cgColor)
		context.setLineWidth(lineWidth)
		// Inset the rect to account for the fact that strokes are
		// centred on the bounds of the shape.
		let rect = CGRect(origin: .zero, size: size).insetBy(dx: lineWidth * 0.5, dy: lineWidth * 0.5)
		context.addEllipse(in: rect)
		context.strokePath()

		let image = UIGraphicsGetImageFromCurrentImageContext()
		UIGraphicsEndImageContext()
		return image
	}
}

extension UIView {
	func findViews<T: UIView>(subclassOf: T.Type) -> [T] {
		recursiveSubviews.compactMap { $0 as? T }
	}

	var recursiveSubviews: [UIView] {
		subviews + subviews.flatMap(\.recursiveSubviews)
	}
}
