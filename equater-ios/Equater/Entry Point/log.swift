//
//  log.swift
//  Equater
//
//  Created by Robert B. Menke on 1/23/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Datadog
import Foundation

private let LOG_PREFIX = "[iOS App] "

func createDatadogLogger() -> DDLogger {
	let environment = EnvironmentService.get(.environment)
	let config = Datadog
		.Configuration
		.builderUsing(
			clientToken: EnvironmentService.get(.dataDogClientKey),
			environment: environment
		)
		.build()

	Datadog.initialize(
		appContext: .init(),
		trackingConsent: .granted,
		configuration: config
	)

	Datadog.verbosityLevel = .warn

	return Logger.builder
		.sendNetworkInfo(true)
		.sendLogsToDatadog(true)
		.set(serviceName: "Equater iOS")
		.set(loggerName: "iOS Logger")
		.printLogsToConsole(true, usingFormat: .shortWith(prefix: LOG_PREFIX))
		.build()
}

let logger = createDatadogLogger()

extension DDLogger {
	func console(_ message: String) {
		print("\(LOG_PREFIX) \(message)")
	}
}
