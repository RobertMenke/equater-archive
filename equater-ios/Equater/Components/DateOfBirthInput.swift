//
//  DateOfBirthInput.swift
//  Equater
//
//  Created by Robert B. Menke on 10/14/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct DateOfBirthInput: View {
	var dateFormatter: DateFormatter {
		let formatter = DateFormatter()
		formatter.dateStyle = .long
		return formatter
	}

	@Binding var birthDate: Date

	var body: some View {
		DatePicker(
			"Date of birth",
			selection: self.$birthDate,
			displayedComponents: .date
		)
		.font(.system(size: 18.0))

		//        FormField(label: "Date of birth", input: {
//
		////            DatePicker(
		////                $birthDate,
		////                maximumDate: Date(),
		////                displayedComponents: .date
		////            )
		//        })
	}
}

struct DateOfBirthInput_Previews: PreviewProvider {
	@State static var date = Date()

	static var previews: some View {
		Form {
			DateOfBirthInput(birthDate: $date)
		}
	}
}
