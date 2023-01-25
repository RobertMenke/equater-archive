//
//  Haptic.swift
//  Equater
//
//  Created by Robert B. Menke on 5/3/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import CoreHaptics
import Foundation

enum HapticEvent {
	case buttonTap
}

class HapticEngine {
	private var engine: CHHapticEngine?

	mutating func initializeEngine() {
		guard CHHapticEngine.capabilitiesForHardware().supportsHaptics, engine == nil else { return }

		do {
			engine = try CHHapticEngine()
			try engine?.start()
			engine?.stoppedHandler = { reason in
				print("ENGINE STOPPED \(reason)")
			}
			engine?.resetHandler = {
				do {
					try self.engine?.start()
				} catch let err {
					print("Failed to start haptic engine in reset handler")
				}
			}
		} catch let err {
			print("Error starting haptic engine \(err.localizedDescription)")
		}
	}

	func play(_ event: HapticEvent) {
		guard let engine = engine else { return }
		let events = getHapticEvents(event)

		do {
			let pattern = try CHHapticPattern(events: events, parameterCurves: [])
			let player = try engine.makePlayer(with: pattern)
			try player.start(atTime: 0)
		} catch let err {
			print("Failed to play pattern: \(err.localizedDescription)")
		}
	}

	private func getHapticEvents(_ event: HapticEvent) -> [CHHapticEvent] {
		switch event {
		case .buttonTap:
			return makeButtonTapEvents()
		}
	}

	private func makeButtonTapEvents() -> [CHHapticEvent] {
		var events = [CHHapticEvent]()
		let intensity = CHHapticEventParameter(
			parameterID: .hapticIntensity,
			value: 1
		)
		let sharpness = CHHapticEventParameter(
			parameterID: .hapticSharpness,
			value: 1
		)
		let event = CHHapticEvent(
			eventType: .hapticTransient,
			parameters: [intensity, sharpness],
			relativeTime: 0
		)

		events.append(event)

		return events
	}
}

var hapticEngine = HapticEngine()
