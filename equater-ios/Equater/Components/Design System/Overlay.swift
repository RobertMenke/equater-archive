//
//  Overlay.swift
//  Equater
//
//  Created by Robert B. Menke on 5/6/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct Overlay: View {
	@Binding var visible: Bool
	private let screenHeight = UIScreen.main.bounds.size.height
	private let screenWidth = UIScreen.main.bounds.size.width
	@State private var safeAreaHeight: CGFloat = 20

	var body: some View {
		GeometryReader { (geo: GeometryProxy) in
			VStack {
				Spacer()
			}
			.frame(width: self.screenWidth, height: self.screenHeight + self.safeAreaHeight)
			.background(AppColor.backgroundSecondary.color)
			.opacity(self.visible ? 0.7 : 0.0)
			.animation(.spring())
			.edgesIgnoringSafeArea(.all)
			.onTapGesture {
				self.visible = false
			}
			.onAppear {
				// For some reason, SwiftUI reports geo.safeAreaInsets.top as 0 (maybe due to edgesIgnoringSafeArea?)
				if geo.safeAreaInsets.top > 0 {
					self.safeAreaHeight = geo.safeAreaInsets.top
				}
			}
		}
	}
}

struct Overlay_Previews: PreviewProvider {
	static var previews: some View {
		Overlay(visible: .constant(true))
	}
}
