//
//  LegalDocumentView.swift
//  Equater
//
//  Created by Robert B. Menke on 7/14/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI
import WebKit

struct LegalDocumentView: View {
	var webView: WKWebView

	var body: some View {
		WebView(preInitializedWebView: webView).frameFillParent()
	}
}

struct LegalDocumentView_Previews: PreviewProvider {
	static var previews: some View {
		let privacyWebView: PrivacyWebView = Resolver.resolve()
		LegalDocumentView(webView: privacyWebView)
	}
}
