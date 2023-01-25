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
	/// Nil if uninitialized
	private var engine: CHHapticEngine?

	static let shared = HapticEngine()

	private init() {}

	/// Note: The engine will be stopped whenever the app is backgrounded
	/// and must be re-initialized in UISceneDelegate when the app comes
	/// back into the foreground
	func initializeEngine() {
		guard CHHapticEngine.capabilitiesForHardware().supportsHaptics, engine == nil else { return }

		do {
			engine = try CHHapticEngine()
			try engine?.start()
			// The engine will stop whenever the app is backgrounded
			engine?.stoppedHandler = { _ in
				self.engine = nil
			}

			engine?.resetHandler = { [weak self] in
				do {
					try self?.engine?.start()
				} catch let err {
					logger.error("Engine failed to start in reset handler \(err.localizedDescription)")
				}
			}
		} catch let err {
			logger.error("Error starting haptic engine \(err.localizedDescription)")
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
			logger.error("Failed to play pattern: \(err.localizedDescription)")
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
			value: 0.5
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

	private func sliderClick() -> [CHHapticEvent] {
		var events = [CHHapticEvent]()

		let intensity = CHHapticEventParameter(
			parameterID: .hapticIntensity,
			value: 0.5
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
