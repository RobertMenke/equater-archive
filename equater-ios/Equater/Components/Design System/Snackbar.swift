//
//  Snackbar.swift
//  Equater
//
//  Created by Robert B. Menke on 5/3/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import MaterialComponents.MaterialSnackbar
import MaterialComponents.MaterialSnackbar_TypographyThemer
import SwiftUI

struct SnackbarAction {
	let text: String
	let handler: () -> Void
}

func showSnackbar(message: String, action: SnackbarAction? = nil) {
	let snackbar = MDCSnackbarMessage()
	snackbar.text = message
	snackbar.accessibilityLabel = message

	if let action = action {
		let snackbarAction = MDCSnackbarMessageAction()
		snackbarAction.handler = action.handler
		snackbarAction.title = action.text
		snackbar.action = snackbarAction
	}

	let scheme = MDCTypographyScheme()
	scheme.body1 = AppFont.primaryText.getUIFont()
	scheme.body2 = AppFont.subText.getUIFont()
	scheme.headline1 = AppFont.title.getUIFont()
	scheme.subtitle1 = AppFont.subtitle.getUIFont()

	MDCSnackbarTypographyThemer.applyTypographyScheme(scheme)

	MDCSnackbarManager.show(snackbar)
}
