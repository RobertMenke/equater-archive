//
//  UIImage.swift
//  Equater
//
//  Created by Robert B. Menke on 1/5/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import AVFoundation
import Foundation
import UIKit

extension UIImage {
	func createCroppedCircleImage() -> UIImage? {
		let imgLayer = CALayer()
		let imageView = UIImageView(image: self)
		imgLayer.frame = imageView.bounds
		imgLayer.contents = imageView.image?.cgImage
		imgLayer.masksToBounds = true

		imgLayer.cornerRadius = 28

		UIGraphicsBeginImageContext(imageView.bounds.size)
		guard let graphicsContext = UIGraphicsGetCurrentContext() else {
			return nil
		}

		imgLayer.render(in: graphicsContext)
		let roundedImage = UIGraphicsGetImageFromCurrentImageContext()
		UIGraphicsEndImageContext()

		return roundedImage
	}

	/// https://www.raywenderlich.com/books/ios-apprentice/v8.3/chapters/30-image-picker
	func resized(withBounds bounds: CGSize) -> UIImage? {
		let horizontalRatio = bounds.width / size.width
		let verticalRatio = bounds.height / size.height
		let ratio = min(horizontalRatio, verticalRatio)
		let imageSize = CGSize(
			width: size.width * ratio,
			height: size.height * ratio
		)

		UIGraphicsBeginImageContextWithOptions(imageSize, true, 0)
		draw(in: CGRect(origin: CGPoint.zero, size: imageSize))
		let scaledImage = UIGraphicsGetImageFromCurrentImageContext()
		UIGraphicsEndImageContext()

		return scaledImage
	}
}
