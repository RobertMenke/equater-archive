//
//  WebView.swift
//  Equater
//
//  Created by Robert B. Menke on 7/14/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI
import WebKit

struct WebView: UIViewRepresentable {
	let webView: WKWebView

	init(url: String) {
		webView = WKWebView()
		webView.isOpaque = false
		webView.backgroundColor = UIColor.clear
		if let url = URL(string: url) {
			webView.load(URLRequest(url: url))
		}
	}

	init(preInitializedWebView: WKWebView) {
		webView = preInitializedWebView
	}

	static func forTermsOfService() -> WebView {
		let termsWebView: TermsWebView = Resolver.resolve()
		return WebView(preInitializedWebView: termsWebView)
	}

	static func forPrivacyPolicy() -> WebView {
		let privacyWebView: PrivacyWebView = Resolver.resolve()
		return WebView(preInitializedWebView: privacyWebView)
	}

	func makeUIView(context: UIViewRepresentableContext<WebView>) -> WKWebView {
		webView.navigationDelegate = context.coordinator

		return webView
	}

	func updateUIView(_ uiView: WKWebView, context: Context) {}

	func makeCoordinator() -> Coordinator {
		Coordinator(self)
	}

	final class Coordinator: NSObject, WKNavigationDelegate {
		let view: WebView

		init(_ view: WebView) {
			self.view = view
		}
	}
}
