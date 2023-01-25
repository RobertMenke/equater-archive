//
//  RecurringExpenseUserCard.swift
//  Equater
//
//  Created by Robert B. Menke on 6/21/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Bow
import Resolver
import SwiftUI

struct RecurringExpenseUserCard: View {
	@InjectedObject private var viewModel: RecurringExpenseViewModel
	var user: Either<String, User>
	@SwiftUI.State var textValue = "1.00"
	@SwiftUI.State var isValid = true
	@SwiftUI.State private var previousTextValue = "1.00"
	@SwiftUI.State private var profileImage: UIImage? = nil

	var body: some View {
		Card {
			self.createAvatar()

			VStack(alignment: .leading, spacing: 4) {
				AppText(self.createPrimaryText(), font: .primaryText)
					.padding(.leading, 4)

				AppText(self.viewModel.getDescription(), font: .subText)
					.padding(.leading, 4)
					.font(.system(size: 12))
			}

			Spacer()

			HStack {
				AppText("$", font: .primaryText)

				PlainTextField(
					textValue: self.$textValue,
					placeholder: "",
					isFirstResponder: false,
					styleTextField: { textField in
						textField.backgroundColor = AppColor.backgroundPrimary.uiColor
						textField.layer.cornerRadius = 4.0
						textField.textAlignment = .center
						textField.keyboardType = .decimalPad
					},
					onTextChanged: { textValue in
						DispatchQueue.main.async {
							if let decimal = Decimal(string: textValue.replacingOccurrences(of: ",", with: "")),
							   let parsedNumber = NSDecimalNumber.currency(decimal: decimal)
							{
								// TODO: Figure out maximum amount we can send at once
								guard decimal < 10000 else {
									self.textValue = self.previousTextValue
									return
								}

								self.isValid = decimal > 0
								// Don't round while typing a decimal
								if textValue.last != ".", textValue.suffix(2) != ".0" {
									self.textValue = parsedNumber
									self.previousTextValue = parsedNumber
									self.updateContribution()
								}
							} else {
								self.isValid = false
							}

							if !self.isValid {
								self.setError(message: "Please enter a valid dollar amount")
							}
						}
					}
				)
				.overlay(self.getBorderColor())
			}
			.frame(minWidth: 0, maxWidth: 90, minHeight: 0, maxHeight: 30, alignment: .trailing)
		}
		.onAppear {
			self.updateContribution()
		}
	}

	private func getBorderColor() -> some View {
		let color = isValid ? AppColor.backgroundPrimary.color : Color.red

		return RoundedRectangle(cornerRadius: 4).stroke(color, lineWidth: 1)
	}

	private func createPrimaryText() -> String {
		user.fold(
			{ email in email },
			{ user in "\(user.firstName) \(user.lastName)" }
		)
	}

	private func createAvatar() -> some View {
		user.fold(
			{ email in UserInviteAvatar(email: email).typeErased },
			{ user in ProfilePhotoAvatar(user: user, image: self.$profileImage).typeErased }
		)
	}

	// TODO: Limit based on max amount we can send
	private func updateContribution() {
		let digits = textValue.replacingOccurrences(of: ",", with: "")
		guard let decimal = Decimal(string: digits) else { return }
		guard decimal > 0, decimal <= 10000 else { return }
		let integerContribution = Int(truncating: NSDecimalNumber(decimal: decimal * 100))

		let contribution = Contribution(contributionType: .fixed, contributionValue: integerContribution)

		user.fold(
			{ email in self.viewModel.setContribution(forEmail: email, contribution: contribution) },
			{ user in self.viewModel.setContribution(forUser: user, contribution: contribution) }
		)
	}

	private func setError(message: String) {
		user.fold(
			{ email in self.viewModel.setError(forEmail: email, error: AppError.inputError(message)) },
			{ user in self.viewModel.setError(forUser: user, error: AppError.inputError(message)) }
		)
	}
}

struct RecurringExpenseUserCard_Previews: PreviewProvider {
	static var previews: some View {
		RecurringExpenseUserCard(user: .right(userFake))
	}
}
