//
//  Support.swift
//  Equater
//
//  Created by Robert B. Menke on 5/24/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct Support: View {
	@State var showSheet = false
	@State var showMessageSheet = false

	var body: some View {
		GeometryReader { (geo: GeometryProxy) in
			Window {
				VStack {
					Spacer()
					Spacer()

					VStack {
						AppText("Call or Text", font: .title)
						AppText("\(EnvironmentService.get(.supportPhoneNumber))", font: .subtitle)
					}
					.frameFillWidth(height: nil, alignment: .center)
					.onTapGesture {
						self.showSheet = true
					}

					Divider()
						.frame(width: geo.size.width / 2, height: 1)
						.background(AppColor.backgroundSecondary.color)

					VStack {
						AppText("Email", font: .title)
						AppText("\(EnvironmentService.get(.supportEmailAddress))", font: .subtitle)
					}
					.frameFillWidth(height: nil, alignment: .center)
					.onTapGesture {
						if let url = URL(string: "mailto:\(EnvironmentService.get(.supportEmailAddress))?subject=Equater%20Support%20Request&body=Hey%20Equater%20support%20team,%20I'm%20having%20an%20issue%20with%20the%20app.") {
							UIApplication.shared.open(url)
						}
					}

					Spacer()

					Text("Our US-based support team typically responds within 24 hours")
						.font(.custom("Inter", size: 18))
						.foregroundColor(AppColor.textPrimary.color)
						.bold()
						.lineSpacing(3)
						.multilineTextAlignment(.center)
						.frame(width: 350)

					Spacer()
				}
				.frameFillParent(alignment: .center)
			}
			.navigationTitle(Text("Support"))
		}
		.withSheet(visible: self.$showSheet) {
			MenuItem(icon: .call, text: "Call") {
				if let url = URL(string: "tel:\(EnvironmentService.get(.supportPhoneNumberE164))") {
					UIApplication.shared.open(url)
				}

				self.showSheet = false
			}

			MenuItem(icon: .chat, text: "Text") {
				self.showMessageSheet = true
				self.showSheet = false
			}
		}
		.sheet(isPresented: self.$showMessageSheet) {
			TextMessage(number: EnvironmentService.get(.supportPhoneNumberE164)) {
				self.showMessageSheet = false
			}
		}
	}
}

struct Support_Previews: PreviewProvider {
	static var previews: some View {
		Support()
	}
}
