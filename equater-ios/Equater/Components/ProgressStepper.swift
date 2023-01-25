//
//  ProgressStepper.swift
//  Equater
//
//  Created by Robert B. Menke on 1/12/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import SwiftUI

protocol ProgressStepperDescriptor {
	func getSteps() -> [ProgressStepperDescriptor]
	func getStepIndex() -> UInt
	func getTitle() -> String
	func hasBeenVisited(currentStep: ProgressStepperDescriptor) -> Bool
}

private let ITEM_DIAMETER: CGFloat = 24

struct ProgressStepper: View {
	let currentStep: ProgressStepperDescriptor
	let items: [ProgressStepperDescriptor]
	var backgroundColor: AppColor = .backgroundPrimary
	var onItemTapped: (ProgressStepperDescriptor) -> Void

	var body: some View {
		HStack(alignment: .center) {
			ForEach(items.indices, id: \.self) { index in
				VStack(alignment: .center, spacing: 4) {
					if items[index].hasBeenVisited(currentStep: currentStep) {
						ProgressStepperStepVisited()
							.transition(.pivot)
					} else {
						ProgressStepperStepNotVisited()
							.transition(.pivot)
					}

					AppText(items[index].getTitle(), font: .custom(size: 10.0, color: .textPrimary))
						.multilineTextAlignment(.center)
						.fixedSize()
				}
				.frame(width: 34)
				.onTapGesture {
					withAnimation {
						onItemTapped(items[index])
					}
				}

				if index != items.count - 1 {
					Rectangle()
						.fill(AppColor.accentPrimaryForText.color)
						.frameFillWidth(height: 4)
						.cornerRadius(2)
						.padding(.bottom, 12)
				}
			}
		}
		.frameFillWidth(height: 40, alignment: .center)
	}
}

struct ProgressStepperStepVisited: View {
	var body: some View {
		Circle()
			.foregroundColor(AppColor.accentPrimaryForText.color)
			.frame(width: ITEM_DIAMETER - 1, height: ITEM_DIAMETER - 1, alignment: .center)
	}
}

struct ProgressStepperStepNotVisited: View {
	var backgroundColor: AppColor = .backgroundPrimary

	var body: some View {
		ZStack {
			Circle()
				.strokeBorder(AppColor.accentPrimaryForText.color, lineWidth: 4)
				.frame(width: ITEM_DIAMETER, height: ITEM_DIAMETER, alignment: .center)
				.background(Circle().foregroundColor(backgroundColor.color))

			Rectangle()
				.fill(backgroundColor.color)
				.frame(width: ITEM_DIAMETER + 1, height: 8)
				.rotationEffect(Angle(degrees: 45.0))

			Rectangle()
				.fill(backgroundColor.color)
				.frame(width: ITEM_DIAMETER + 1, height: 8)
				.rotationEffect(Angle(degrees: -45.0))
		}
	}
}

struct ProgressStepper_Previews: PreviewProvider {
	static var items: [ProgressStepperDescriptor] {
		MerchantSharedExpenseStep.allCases
	}

	static var previews: some View {
		ProgressStepper(currentStep: MerchantSharedExpenseStep.selectAccount, items: items) { item in
			print("item tapped \(item)")
		}
	}
}
