import UIKit

extension UIFont {
	func withTraits(traits: UIFontDescriptor.SymbolicTraits) -> UIFont {
		guard let descriptor = fontDescriptor.withSymbolicTraits(traits) else {
			return self
		}

		return UIFont(descriptor: descriptor, size: 0) // size 0 means keep the size as it is
	}

	func bold() -> UIFont {
		withTraits(traits: .traitBold)
	}

	func italic() -> UIFont {
		withTraits(traits: .traitItalic)
	}
}
