//
//  ExpenseContributionUserCard.swift
//  Equater
//
//  Created by Robert B. Menke on 6/13/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Bow
import Resolver
import SwiftUI

enum ExpenseContributionUserCard {
	case splitEvenly(user: Either<String, User>)
	case percentage(user: Either<String, User>)
	case fixedAmount(user: Either<String, User>)

	var cardView: some View {
		switch self {
		case .splitEvenly(let user):
			return SplitEvenlyUserCard(user: user).typeErased
		case .percentage(let user):
			return PercentageSplitUserCard(user: user).typeErased
		case .fixedAmount(let user):
			return FixedSplitUserCard(user: user).typeErased
		}
	}
}

enum ExpenseContributionOwnerCard {
	case splitEvenly(user: User)
	case percentage(user: User)
	case fixedAmount(user: User)

	var cardView: some View {
		switch self {
		case .splitEvenly(let user):
			return SplitEvenlyExpenseOwnerCard(user: user).typeErased
		case .percentage(let user):
			return PercentageSplitExpenseOwnerCard(user: user).typeErased
		case .fixedAmount(let user):
			return FixedSplitExpenseOwnerCard(user: user).typeErased
		}
	}
}

struct SplitEvenlyUserCard: View {
	@InjectedObject private var viewModel: MerchantExpenseViewModel
	var user: Either<String, User>
	@SwiftUI.State private var profileImage: UIImage? = nil

	var body: some View {
		Card {
			self.createAvatar()

			VStack(alignment: .leading, spacing: 4) {
				AppText(self.createPrimaryText(), font: .primaryText)
					.padding(.leading, 20)
					.lineLimit(1)

				AppText("Will pay 1/\(self.viewModel.countTotalParticipants()) of the total", font: .subText)
					.padding(.leading, 20)
					.font(.system(size: 12))
			}

			Spacer()

			Fraction(numerator: "1", denominator: String(self.viewModel.countTotalParticipants()))
		}
		.onAppear {
			self.updateContribution()
		}
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

	private func updateContribution() {
		let contribution = Contribution(contributionType: .splitEvenly, contributionValue: nil)

		user.fold(
			{ email in self.viewModel.setContribution(forEmail: email, contribution: contribution) },
			{ user in self.viewModel.setContribution(forUser: user, contribution: contribution) }
		)
	}
}

private func createPercentageFormatter() -> NumberFormatter {
	let percentageFormatter = NumberFormatter()
	percentageFormatter.numberStyle = .none
	percentageFormatter.maximumIntegerDigits = 100
	percentageFormatter.minimumIntegerDigits = 0

	return percentageFormatter
}

struct PercentageSplitUserCard: View {
	@InjectedObject private var viewModel: MerchantExpenseViewModel
	var user: Either<String, User>
	@SwiftUI.State var textValue = "50"
	@SwiftUI.State private var previousTextValue = "50"
	@SwiftUI.State private var isValid = true

	@SwiftUI.State private var profileImage: UIImage? = nil

	var body: some View {
		Card {
			self.createAvatar()

			VStack(alignment: .leading, spacing: 4) {
				AppText(self.createPrimaryText(), font: .primaryText)
					.padding(.leading, 20)
					.lineLimit(1)

				AppText("Pays \(self.textValue)% of the total", font: .subText)
					.padding(.leading, 20)
					.font(.system(size: 12))
			}

			Spacer()

			HStack {
				PlainTextField(
					textValue: self.$textValue,
					placeholder: "",
					isFirstResponder: false,
					styleTextField: { textField in
						textField.backgroundColor = AppColor.backgroundPrimary.uiColor
						textField.layer.cornerRadius = 4.0
						textField.textAlignment = .center
						textField.keyboardType = .numberPad
					},
					onTextChanged: { textValue in
						if let parsedNumber = NSDecimalNumber.wholeNumberPercentage(string: textValue) {
							DispatchQueue.main.async {
								guard parsedNumber <= 100 else {
									self.textValue = self.previousTextValue
									return
								}

								self.isValid = parsedNumber.decimalValue > 0 && parsedNumber <= 100
								self.textValue = parsedNumber.stringValue
								self.previousTextValue = parsedNumber.stringValue
								self.updateContribution()
							}
						} else {
							self.isValid = false
						}

						if !self.isValid {
							self.setError(message: "Please enter a value between 1 and 100")
						}
					}
				)
				.overlay(self.getBorderColor())

				AppText("%", font: .primaryText)
			}
			.frame(width: 80, height: 30, alignment: .trailing)
		}
		.onAppear {
			self.setInitialPercentage()
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

	private func setInitialPercentage() {
		let contribution = Int(floor(Double(100 / viewModel.countTotalParticipants())))
		let contributionDisplay = String(contribution)
		textValue = contributionDisplay
		previousTextValue = contributionDisplay
	}

	private func updateContribution() {
		guard let value = Int(textValue), value > 0, value <= 100 else { return }
		let contribution = Contribution(contributionType: .percentage, contributionValue: value)

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

struct FixedSplitUserCard: View {
	@InjectedObject private var viewModel: MerchantExpenseViewModel
	var user: Either<String, User>
	@SwiftUI.State var textValue = "50"
	@SwiftUI.State var isValid = true
	@SwiftUI.State private var previousTextValue = "50"
	@SwiftUI.State private var profileImage: UIImage? = nil

	var body: some View {
		Card {
			self.createAvatar()

			VStack(alignment: .leading, spacing: 4) {
				AppText(self.createPrimaryText(), font: .primaryText)
					.padding(.leading, 4)
					.lineLimit(1)

				AppText("Paid when you're charged", font: .subText)
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
									// This is a hack to allow a number like $50.70 to be entered
									if textValue.last == "0", textValue.suffix(3).first == "." {
										self.textValue = parsedNumber + "0"
									} else {
										self.textValue = parsedNumber
									}

									self.previousTextValue = self.textValue
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

struct SplitEvenlyExpenseOwnerCard: View {
	@InjectedObject private var viewModel: MerchantExpenseViewModel
	var user: User
	@SwiftUI.State private var profileImage: UIImage? = nil

	var body: some View {
		Card {
			ProfilePhotoAvatar(user: user, image: self.$profileImage)

			VStack(alignment: .leading, spacing: 4) {
				AppText("You", font: .primaryText)
					.padding(.leading, 20)
					.lineLimit(1)

				AppText("Will pay 1/\(self.viewModel.countTotalParticipants()) of the total", font: .subText)
					.padding(.leading, 20)
					.font(.system(size: 12))
			}

			Spacer()

			Fraction(numerator: "1", denominator: String(self.viewModel.countTotalParticipants()))
		}
	}
}

struct PercentageSplitExpenseOwnerCard: View {
	@InjectedObject private var viewModel: MerchantExpenseViewModel
	var user: User
	@SwiftUI.State private var profileImage: UIImage? = nil

	var body: some View {
		Card {
			ProfilePhotoAvatar(user: user, image: self.$profileImage)

			VStack(alignment: .leading, spacing: 4) {
				AppText("You", font: .primaryText)
					.padding(.leading, 20)
					.lineLimit(1)

				AppText("Pay \(viewModel.expenseOwnerPercentageContribution)% of the total", font: .subText)
					.padding(.leading, 20)
					.font(.system(size: 12))
			}

			Spacer()

			HStack {
				AppText(viewModel.expenseOwnerPercentageContribution, font: .primaryText)
				AppText("%", font: .primaryText)
			}
			.frame(width: 80, height: 30, alignment: .trailing)
		}
	}
}

struct FixedSplitExpenseOwnerCard: View {
	@InjectedObject private var viewModel: MerchantExpenseViewModel
	var user: User
	@SwiftUI.State private var profileImage: UIImage? = nil

	var body: some View {
		Card {
			ProfilePhotoAvatar(user: user, image: self.$profileImage)

			VStack(alignment: .leading, spacing: 4) {
				AppText("You", font: .primaryText)
					.padding(.leading, 4)
					.lineLimit(1)

				AppText("Pay the remainder of the bill.", font: .subText)
					.padding(.leading, 4)
					.font(.system(size: 12))
			}

			Spacer()
		}
	}
}

struct ExpenseContributionUserCard_Previews: PreviewProvider {
	static var previews: some View {
		VStack(spacing: 20) {
			SplitEvenlyUserCard(user: .right(userFake))
			PercentageSplitUserCard(user: .right(userFake))
			FixedSplitUserCard(user: .right(userFake))
		}
	}
}
