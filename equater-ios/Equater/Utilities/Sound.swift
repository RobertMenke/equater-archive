//
//  Sound.swift
//  Equater
//
//  Created by Robert B. Menke on 10/31/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import AVFoundation
import Foundation

enum Sound: SystemSoundID {
	case applePay = 1407

	func play() {
		// https://github.com/TUNER88/iOSSystemSoundsLibrary
		AudioServicesPlayAlertSoundWithCompletion(rawValue) {
			logger.console("Sound attempted")
		}
	}
}
