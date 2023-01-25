//
//  TabbedRadioButtons.swift
//  Equater
//
//  Created by Robert B. Menke on 6/11/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import MaterialComponents.MaterialButtons
import SwiftUI

struct RadioButtonModel: Hashable, Codable, Identifiable {
	var id: String { title }
	let title: String
	var isSelected = false
	var badgeWithCount: UInt = 0
}

struct TabbedRadioButtons: View {
	var buttons: [RadioButtonModel]
	let onSelection: (RadioButtonModel) -> Void

	var body: some View {
		HStack(alignment: .center, spacing: 0) {
			ForEach(buttons) { button in
				ZStack {
					ContainedButton(
						label: button.title,
						enabled: true,
						size: .custom(width: .infinity, height: 40),
						isLoading: .constant(false),
						backgroundColor: button.isSelected ? .accentPrimary : .backgroundSecondary,
						textColor: button.isSelected ? .white : .textPrimary,
						onTap: {
							// The parent component is in charge of providing TabbedRadioButtons with an updated buttons array here
							if let selection = self.buttons.first(where: { item in item.title == button.title }) {
								self.onSelection(selection)
							}
						}
					)
					.padding(.leading, 1)
					.cornerRadius(4)

					HStack {
						Badge(count: button.badgeWithCount)
							.padding(.leading, 4)
						Spacer()
					}
				}
			}
		}
		.frameFillWidth(height: 40)
		.padding([.leading, .trailing], 1)
	}
}

struct TabbedRadioButtons_Previews: PreviewProvider {
	static var previews: some View {
		let buttons: [RadioButtonModel] = [
			RadioButtonModel(title: "Active", isSelected: true, badgeWithCount: 0),
			RadioButtonModel(title: "Pending", isSelected: false, badgeWithCount: 2),
			RadioButtonModel(title: "Inactive", isSelected: false, badgeWithCount: 0),
		]

		return TabbedRadioButtons(buttons: buttons) { selection in
			print(selection)
		}
	}
}
