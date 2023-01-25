//
//  Legal.swift
//  Equater
//
//  Created by Robert B. Menke on 7/14/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI
import WebKit

struct LegalItem: Hashable, Identifiable {
	var id: String { title }
	let title: String
	let subtitle: String
	let webView: WKWebView
}

struct Legal: View {
	@Injected private var termsWebView: TermsWebView
	@Injected private var privacyWebView: PrivacyWebView

	func getData() -> [LegalItem] {
		[
			LegalItem(
				title: "Privacy Policy",
				subtitle: "🔒 Our data usage policy",
				webView: privacyWebView
			),
			LegalItem(
				title: "Terms of Service",
				subtitle: "🤝 Disclaimers & fair usage",
				webView: termsWebView
			),
		]
	}

	var body: some View {
		let data = getData()

		return Window {
			LegalRow(item: data[0]).padding(.leading, 8)

			Divider()
				.frame(height: 1)
				.background(AppColor.backgroundSecondary.color)
				.padding(.leading, 8)

			LegalRow(item: data[1]).padding(.leading, 8)

			Divider()
				.frame(height: 1)
				.background(AppColor.backgroundSecondary.color)
				.padding(.leading, 8)
		}
		.offset(y: 1)
		.navigationTitle(Text("Legal"))
	}
}

private struct LegalRow: View {
	let item: LegalItem
	@State private var isActive = false

	var body: some View {
		ZStack {
			NavigationLink(
				destination: LegalDocumentView(webView: item.webView),
				isActive: $isActive,
				label: { Text("") }
			)
			.hidden()

			HStack(alignment: .center) {
				VStack(alignment: .leading) {
					AppText(item.title, font: .title)
					AppText(item.subtitle, font: .subtitle)
				}
				.padding(.leading, 8)

				Spacer()

				Image(systemName: "chevron.right")
					.font(.system(size: 24.0, weight: .bold))
					.foregroundColor(AppColor.textPrimary.color)
					.padding(.trailing, 16)
			}
		}
		.contentShape(Rectangle())
		.onTapGesture {
			self.isActive = true
		}
	}
}

struct Legal_Previews: PreviewProvider {
	static var previews: some View {
		Legal()
	}
}
