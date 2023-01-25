//
//  ProfilePhotoUpload.swift
//  Equater
//
//  Created by Robert B. Menke on 1/4/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

enum PhotoUploadType {
	/// Go to the camera app to take a picture
	case takePicture

	/// Go to the photos app to select an existing picture
	case selectPicture
}

private let COVER_PHOTO_CACHE_KEY = "COVER_PHOTO_CACHE"
private let PROFILE_PHOTO_CACHE_KEY = "PROFILE_PHOTO_CACHE"
private let VENDOR_LOGO_CACHE_KEY = "VENDOR_LOGO_CACHE"
private let PLAID_INSTITUTION_CACHE_KEY = "PLAID_INSTITUTION_CACHE"

enum Photo: Equatable, Hashable {
	/// Circular avatar photo
	case avatar(user: User)
	/// Rectangular cover photo (sits behind avatar)
	case coverPhoto(user: User)
	/// Vendor logo
	case vendorLogo(vendor: Vendor)
	/// Plaid Institution
	case plaidInstitution(institution: Institution)

	func store(image: UIImage) throws {
		guard let localUrl = getFullLocalUrl() else { return }
		guard let data = image.pngData() else { return }
		try data.write(to: localUrl, options: .atomic)
		setCacheKey()
	}

	func getRemoteUrl() -> String? {
		switch self {
		case .avatar(let user):
			return user.preSignedPhotoDownloadUrl
		case .coverPhoto(let user):
			return user.preSignedCoverPhotoDownloadUrl
		case .vendorLogo(let vendor):
			return vendor.logoUrl
		case .plaidInstitution(let institution):
			return institution.logoUrl
		}
	}

	/// This exact name is used server-side as well so don't change
	/// the case
	func getKeyName() -> String {
		switch self {
		case .avatar:
			return "AVATAR"
		case .coverPhoto:
			return "COVER_PHOTO"
		case .vendorLogo:
			return "VENDOR_LOGO"
		case .plaidInstitution:
			return "PLAID_INSTITUTION"
		}
	}

	func getHash() -> String? {
		switch self {
		case .avatar(let user):
			return user.profilePhotoSha256Hash
		case .coverPhoto(let user):
			return user.coverPhotoSha256Hash
		case .vendorLogo(let vendor):
			return vendor.logoSha256Hash
		case .plaidInstitution(let institution):
			return institution.logoSha256Hash
		}
	}

	func getDefaultImage() -> AppImage {
		switch self {
		case .avatar:
			return AppImage.defaultProfileImage
		case .coverPhoto:
			return AppImage.defaultProfileImage
		case .vendorLogo:
			return AppImage.shoppingBagIcon
		case .plaidInstitution:
			return AppImage.wallet
		}
	}

	func isUserAvatar() -> Bool {
		switch self {
		case .avatar:
			return true
		default:
			return false
		}
	}

	func isVendorLogo() -> Bool {
		switch self {
		case .vendorLogo:
			return true
		default:
			return false
		}
	}

	func getCacheKey() -> String {
		switch self {
		case .avatar(let user):
			return "\(PROFILE_PHOTO_CACHE_KEY)-\(user.id)"
		case .coverPhoto(let user):
			return "\(COVER_PHOTO_CACHE_KEY)-\(user.id)"
		case .vendorLogo(let vendor):
			return "\(VENDOR_LOGO_CACHE_KEY)-\(vendor.id)"
		case .plaidInstitution(let institution):
			return "\(PLAID_INSTITUTION_CACHE_KEY)-\(institution.id)"
		}
	}

	func shouldInvalidateCache() -> Bool {
		guard let cachedHash = UserDefaults.standard.string(forKey: getCacheKey()) else {
			return true
		}

		return cachedHash != getHash()
	}

	func setCacheKey() {
		UserDefaults.standard.set(getHash(), forKey: getCacheKey())
	}

	/// Creates a url on the local file system for a given user that can be used to store a profile photo
	private func createDocumentUrl() -> URL? {
		let domainMask = FileManager.SearchPathDomainMask.userDomainMask
		guard let url = FileManager.default.urls(for: .documentDirectory, in: domainMask).first else {
			return nil
		}

		return url
	}

	/// Determines whether or not a profile photo exists locally on the file system
	func existsLocally() -> Bool {
		guard let baseUrl = createDocumentUrl() else {
			return false
		}

		let fullUrl = getFullLocalUrl(documentDirectory: baseUrl)

		return FileManager.default.fileExists(atPath: fullUrl.path)
	}

	func getFullLocalUrl(documentDirectory: URL) -> URL {
		let type = getKeyName().lowercased()

		switch self {
		case .avatar(let user):
			return documentDirectory.appendingPathComponent("\(type)_\(user.uuid)")
		case .coverPhoto(let user):
			return documentDirectory.appendingPathComponent("\(type)_\(user.uuid)")
		case .vendorLogo(let vendor):
			return documentDirectory.appendingPathComponent("\(type)_\(vendor.uuid)")
		case .plaidInstitution(let institution):
			return documentDirectory.appendingPathComponent("\(type)_\(institution.uuid)")
		}
	}

	func getFullLocalUrl() -> URL? {
		guard let documentsUrl = createDocumentUrl() else {
			return nil
		}

		return getFullLocalUrl(documentDirectory: documentsUrl)
	}

	/// Loads a profile photo into memory and maps the data to a UIImage instance
	func readLocalImage() -> UIImage? {
		guard let documentsUrl = createDocumentUrl() else { return nil }
		let localUrl = getFullLocalUrl(documentDirectory: documentsUrl)
		guard let data = FileManager.default.contents(atPath: localUrl.path) else {
			logger.console("No data at path")
			return nil
		}

		guard let image = UIImage(data: data) else {
			logger.console("Couldn't create image from data")
			return nil
		}

		return image
	}

	func toString() -> String {
		switch self {
		case .avatar(let user):
			return "user avatar photo for user id \(user.id)"
		case .coverPhoto(let user):
			return "user cover photo for user id \(user.id)"
		case .vendorLogo(let vendor):
			return "vendor logo photo for vendor id \(vendor.id)"
		case .plaidInstitution(let institution):
			return "plaid institution logo for institution \(institution.name)"
		}
	}

	/// Taken from
	/// https://stackoverflow.com/questions/21789770/determine-mime-type-from-nsdata/32765708
	static func getContentType(_ image: Data) -> String {
		var firstByte: UInt8 = 0
		image.copyBytes(to: &firstByte, count: 1)

		switch firstByte {
		case 0xFF:
			return "image/jpeg"
		case 0x89:
			return "image/png"
		case 0x47:
			return "image/gif"
		case 0x4D, 0x49:
			return "image/tiff"
		case 0x25:
			return "application/pdf"
		case 0xD0:
			return "application/vnd"
		case 0x46:
			return "text/plain"
		default:
			return "application/octet-stream"
		}
	}
}

extension View {
	func profilePhoto(
		isVisible: Binding<Bool>,
		image: Binding<UIImage?>,
		uploadType: PhotoUploadType,
		photo: Binding<Photo>,
		onCompletion: @escaping (Photo, UIImage?) -> Void
	) -> some View {
		modifier(ProfilePhotoUpload(
			isVisible: isVisible,
			image: image,
			uploadType: uploadType,
			photo: photo,
			onCompletion: onCompletion
		))
	}
}

/// TODO: This view is complex enough that it probably requires a state machine. It's becoming unwiedly to
/// manage with boolean logic alone
/// TODO: Refactor to use Kingfisher or Nuke https://github.com/onevcat/Kingfisher
struct ProfilePhotoUpload: ViewModifier {
	@Binding var isVisible: Bool
	@Binding var image: UIImage?
	var uploadType: PhotoUploadType
	@Binding var photo: Photo
	/// UIImage will be nil if the selection is canceled
	var onCompletion: (Photo, UIImage?) -> Void

	@Injected var filePersistenceService: FilePersistenceService
	@InjectedObject var appState: AppState
	@InjectedObject var viewModel: PhotoUploadViewModel

	@State var showImageCropper = false
	@State var showActionSheet = false
	@State private var inputImage: UIImage?

	func body(content: Content) -> some View {
		content.sheet(isPresented: $isVisible) {
			Group {
				if self.photo.isUserAvatar(), self.showImageCropper, self.inputImage != nil {
					VStack {
						CropView(
							image: self.$inputImage,
							visible: self.$isVisible,
							onComplete: self.handleImageSelection
						)
					}
				} else {
					ImagePicker(
						image: self.$inputImage,
						isTakingPhoto: self.uploadType == .takePicture
					) { image in

						guard let image = image else {
							showImageCropper = false
							inputImage = nil
							self.onCompletion(self.photo, nil)
							return
						}

						// Avatars require cropping and therefore should hold off on any processing until cropping is done
						if !self.photo.isUserAvatar() {
							self.handleImageSelection(image: image)
						} else {
							self.showImageCropper = true
						}
					}
				}
			}
		}
	}

	/// Note that setting currentImage will not take effect until the next re-render
	func handleImageSelection(image: UIImage) {
		// Input image needs to be kept in sync with image
		// after processing because we do a check later on to detect if
		// a new image has been selected based on inputImage.pngData() == image.data()
		let resizedImage = image.resized(withBounds: getPostProcessedImageSize()) ?? image
		self.image = resizedImage
		inputImage = self.image
		showImageCropper = false
		onCompletion(photo, self.image)
	}

	private func getPostProcessedImageSize() -> CGSize {
		switch photo {
		case .avatar:
			return CGSize(width: 200, height: 200)
		case .coverPhoto:
			return CGSize(width: 1000, height: 250)
		default:
			return CGSize(width: 60, height: 60)
		}
	}

	/// Fetches the profile image from the fastest source (tries local then goes remote)
	/// The callback here is handling the case that we had to download the photo in the background
	private func getProfileImage() {
		filePersistenceService.getPhotoOrFallbackToDefault(photo: photo) { image in
			self.inputImage = image
			self.image = image
		}
	}
}
