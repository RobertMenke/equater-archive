//
//  HourglassLoader.swift
//  Equater
//
//  Created by Robert B. Menke on 8/15/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct HourglassLoader: View {
	var body: some View {
		VStack(alignment: .center) {
			LottieView(fileName: "hourglass", loopMode: .loop)
				.padding(20)
		}
	}
}

struct HourglassLoader_Previews: PreviewProvider {
	static var previews: some View {
		HourglassLoader()
	}
}
