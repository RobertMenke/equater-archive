//
//  FontPreview.swift
//  Equater
//
//  Created by Robert B. Menke on 4/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct FontPreview: View {
	var body: some View {
		HeaderWithContentLayout(
			header: header,
			content: content
		)
	}

	var header: some View {
		VStack(alignment: .leading) {
			AppText("Main Title", font: .title)
			AppText("Subtitle", font: .subtitle)
		}
		.padding(15.0)
	}

	var content: some View {
		VStack(alignment: .leading) {
			AppText("Primary Text", font: .primaryText)
			AppText("Subtext... lorem ipsum etc etc", font: .subText)
		}
		.padding(35.0)
	}
}

struct FontPreview_Previews: PreviewProvider {
	static var previews: some View {
		FontPreview()
	}
}
