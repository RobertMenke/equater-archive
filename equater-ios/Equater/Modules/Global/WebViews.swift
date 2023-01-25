//
//  WebViews.swift
//  Equater
//
//  Created by Robert B. Menke on 9/30/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import Foundation
import Resolver
import WebKit

class TermsWebView: WKWebView {
	init() {
		super.init(frame: .zero, configuration: WKWebViewConfiguration())
		let environmentService: EnvironmentService = Resolver.resolve()

		isOpaque = false
		backgroundColor = UIColor.clear

		if let url = try? environmentService.getWebUrl(endpoint: "/terms?hideMobileMenu=true") {
			load(URLRequest(url: url))
		}
	}

	override init(frame: CGRect, configuration: WKWebViewConfiguration) {
		super.init(frame: frame, configuration: configuration)
	}

	@available(*, unavailable)
	required init?(coder: NSCoder) {
		fatalError("init(coder:) has not been implemented")
	}
}

class PrivacyWebView: WKWebView {
	init() {
		super.init(frame: .zero, configuration: WKWebViewConfiguration())
		let environmentService: EnvironmentService = Resolver.resolve()

		isOpaque = false
		backgroundColor = UIColor.clear

		if let url = try? environmentService.getWebUrl(endpoint: "/privacy?hideMobileMenu=true") {
			load(URLRequest(url: url))
		}
	}

	@available(*, unavailable)
	required init?(coder: NSCoder) {
		fatalError("init(coder:) has not been implemented")
	}
}
