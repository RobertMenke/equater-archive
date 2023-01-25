//
//  ProgressStepperPreview.swift
//  Equater
//
//  Created by Robert B. Menke on 1/16/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import SwiftUI

enum Step: UInt, Identifiable, CaseIterable, ProgressStepperDescriptor {
	case one
	case two
	case three
	case four

	var id: UInt { rawValue }

	func getTitle() -> String {
		switch self {
		case .one:
			return "One"
		case .two:
			return "Two"
		case .three:
			return "Three"
		case .four:
			return "Four"
		}
	}

	func hasBeenVisited(currentStep: ProgressStepperDescriptor) -> Bool {
		rawValue <= currentStep.getStepIndex()
	}

	func getStepIndex() -> UInt {
		rawValue
	}

	func getSteps() -> [ProgressStepperDescriptor] {
		Step.allCases
	}
}

struct ProgressStepperPreview: View {
	@State private var currentStep = Step.two
	var body: some View {
		Window {
			Spacer()
			ProgressStepper(currentStep: currentStep, items: currentStep.getSteps()) { item in
				if let step = item as? Step {
					currentStep = step
				}
			}
			.padding([.leading, .trailing], 14)
			Spacer()
		}
	}
}

struct ProgressStepperPreview_Previews: PreviewProvider {
	static var previews: some View {
		ProgressStepperPreview()
	}
}
