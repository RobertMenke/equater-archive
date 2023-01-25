//
//  ui.swift
//  Equater
//
//  Created by Robert B. Menke on 1/10/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import Foundation
import UIKit

func resignAllResponders() {
	UIApplication.shared.sendAction(
		#selector(UIApplication.resignFirstResponder),
		to: nil,
		from: nil,
		for: nil
	)
}
