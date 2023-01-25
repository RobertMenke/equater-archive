//
//  Badge.swift
//  Equater
//
//  Created by Robert B. Menke on 6/24/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct Badge: View {
	var count: UInt
	var appColor: AppColor = .backgroundPrimary

	var body: some View {
		Group {
			if count > 0 {
				AppText(String(count), font: .custom(size: 11.0, color: .textPrimary))
					.padding(8)
					.background(
						Circle().fill(appColor.color).frame(width: 20, height: 20)
					)
			}
		}
	}
}

struct Badge_Previews: PreviewProvider {
	static var previews: some View {
		VStack(alignment: .center) {
			Badge(count: 5)
		}
		.frameFillParent(alignment: .center)
		.background(AppColor.backgroundSecondary.color)
	}
}
