//
//  AddressInput.swift
//  Equater
//
//  Created by Robert B. Menke on 10/14/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Bow
import Resolver
import SwiftUI

typealias AddressCallback = (Either<AppError, Address>) -> Void

struct AddressInput: View {
	@InjectedObject var viewModel: VerifiedCustomerViewModel
	private let color: UIColor = #colorLiteral(red: 0.7685828805, green: 0.7686585784, blue: 0.7771369219, alpha: 1)

	var body: some View {
		FormField(
			label: "Address",
			input: {
				Text(self.viewModel.address?.displayAddress() ?? "Tap to enter")
					.lineLimit(1)
					.font(.system(size: 18.0))
					.foregroundColor(Color(self.color))
			},
			onTapGesture: {
				self.viewModel.addressSearchIsDisplayed = true
			}
		)
	}
}

struct AddressInput_Previews: PreviewProvider {
	static var previews: some View {
		Form {
			AddressInput()
		}
	}
}
