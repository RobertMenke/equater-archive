//
//  DesignPreview.swift
//  Equater
//
//  Created by Robert B. Menke on 5/7/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

enum DesignPreviewSelection: String, CaseIterable {
	static var userDefaultsKey = "DesignPreviewSelection"

	case fonts
	case lists
	case actionSheets
	case snackbar
	case textField
	case button
	case avatar
	case tabView
	case slider
	case progressStepper

	var headerTitle: String {
		switch self {
		case .fonts:
			return "Fonts"
		case .lists:
			return "Lists"
		case .actionSheets:
			return "Action Sheets"
		case .snackbar:
			return "Snackbar"
		case .textField:
			return "Text Field"
		case .button:
			return "Buttons"
		case .avatar:
			return "Avatar"
		case .tabView:
			return "Tab View"
		case .slider:
			return "Slide to X"
		case .progressStepper:
			return "Progress Stepper"
		}
	}

	static func fromDefaults() -> DesignPreviewSelection {
		if let key = UserDefaults.standard.string(forKey: DesignPreviewSelection.userDefaultsKey),
		   let selection = DesignPreviewSelection(rawValue: key)
		{
			return selection
		}

		return DesignPreviewSelection.allCases.first ?? .fonts
	}
}

struct DesignPreview: View {
	@State private var showNavBar = false
	@State private var preview = DesignPreviewSelection.fromDefaults()

	var body: some View {
		Window {
			HeaderWithContentLayout(
				headerHeight: 95,
				header: NavBarHeader(isShown: self.$showNavBar, title: self.preview.headerTitle),
				content: Group {
					if self.preview == .fonts {
						FontPreview()
					} else if self.preview == .lists {
						ListPreview()
					} else if self.preview == .actionSheets {
						ActionSheetPreview()
					} else if self.preview == .snackbar {
						SnackbarPreview()
					} else if self.preview == .textField {
						TextInputPreview()
					} else if self.preview == .button {
						ButtonPreview()
					} else if self.preview == .avatar {
						AvatarPreview()
					} else if self.preview == .tabView {
						TabViewPreview()
					} else if self.preview == .slider {
						SlideBarPreview()
					} else if self.preview == .progressStepper {
						ProgressStepperPreview()
					}
				}
			)
		}
		.withNavDrawer(
			visible: $showNavBar,
			navContent: {
				NavDrawerLayout(user: userFake, menuItems: [
					MenuItem(icon: .fontIcon, text: "Fonts", height: 80.0) {
						self.showNavBar = false
						self.set(preview: .fonts)
					},
					MenuItem(icon: .listIcon, text: "Lists", height: 80.0) {
						self.showNavBar = false
						self.set(preview: .lists)
					},
					MenuItem(icon: .centerAlignIcon, text: "Action Sheet", height: 80.0) {
						self.showNavBar = false
						self.set(preview: .actionSheets)
					},
					MenuItem(icon: .notificationIcon, text: "Snackbar", height: 80.0) {
						self.showNavBar = false
						self.set(preview: .snackbar)
					},
					MenuItem(icon: .editIcon, text: "Text Field", height: 80.0) {
						self.showNavBar = false
						self.set(preview: .textField)
					},
					MenuItem(icon: .tapIcon, text: "Button", height: 80.0) {
						self.showNavBar = false
						self.set(preview: .button)
					},
					MenuItem(icon: .profile, text: "Avatar", height: 80.0) {
						self.showNavBar = false
						self.set(preview: .avatar)
					},
					MenuItem(icon: .menu, text: "Tab View", height: 80.0) {
						self.showNavBar = false
						self.set(preview: .tabView)
					},
					MenuItem(icon: .chevronRightDouble, text: "Swipe to x", height: 80.0) {
						self.showNavBar = false
						self.set(preview: .slider)
					},
					MenuItem(icon: .verificationCheck, text: "Progress Stepper", height: 80.0) {
						self.showNavBar = false
						self.set(preview: .progressStepper)
					},
				])
			}
		)
	}

	private func set(preview: DesignPreviewSelection) {
		self.preview = preview
	}
}

struct DesignPreview_Previews: PreviewProvider {
	static var previews: some View {
		DesignPreview()
	}
}
