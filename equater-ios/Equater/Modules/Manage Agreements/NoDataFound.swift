//
//  NoDataFound.swift
//  Equater
//
//  Created by Robert B. Menke on 6/27/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct NoDataFound: View {
	let text: String

	var body: some View {
		VStack(alignment: .center) {
			AppImage.notFound.image.resizable().aspectRatio(contentMode: .fit)
			AppText(text, font: .primaryText).offset(y: -40).multilineTextAlignment(.center)
			Spacer()
		}
		.frameFillParent(alignment: .center)
	}
}

struct NoDataFound_Previews: PreviewProvider {
	static var previews: some View {
		NoDataFound(text: "No foos found")
	}
}
