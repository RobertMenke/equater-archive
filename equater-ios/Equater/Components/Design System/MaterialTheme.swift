//
//  MaterialTheme.swift
//  Equater
//
//  Created by Robert B. Menke on 5/2/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import MaterialComponents

private func globalContainerScheme() -> MDCContainerScheming {
	let scheme = MDCContainerScheme()
	scheme.colorScheme.primaryColor = AppColor.accentPrimary.uiColor
	// TODO: Pick out a secondary color
	scheme.colorScheme.secondaryColor = AppColor.accentLight.uiColor
	scheme.colorScheme.backgroundColor = AppColor.backgroundPrimary.uiColor
	scheme.typographyScheme.body1 = AppFont.primaryText.getUIFont()
	scheme.typographyScheme.button = AppFont.buttonMedium.getUIFont()
	scheme.typographyScheme.headline1 = AppFont.title.getUIFont()
	scheme.typographyScheme.subtitle1 = AppFont.subtitle.getUIFont()

	return scheme
}

let globalMaterialTheme = globalContainerScheme()
