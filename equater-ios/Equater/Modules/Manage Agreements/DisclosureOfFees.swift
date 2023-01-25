//
//  DisclosureOfFees.swift
//  Equater
//
//  Created by Robert B. Menke on 10/31/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct DisclosureOfFees: View {
	let onSelected: (DisclosureOfFeesResponse) -> Void

	var body: some View {
		Window {
			VStack {
				LottieView
					.levitatingFinanceMan()
					.frameFillWidth(height: 350)
					.padding(.top, 50)

				VStack {
					AppText("Our Business Model", font: .title)

					Subtitle

					FeeTableHeader()
						.padding(.top, 16)

					FeeRow(icon: .moneyTransfer, transactionValue: "less than $50", serviceFee: "$0")
					FeeRow(icon: .cardSuccess, transactionValue: "$50-$1000", serviceFee: "$0.50-$2.00")
					FeeRow(icon: .financeChart, transactionValue: "$1000+", serviceFee: "$2.50")

					ContainedButton(
						label: "Fair! Let's Continue",
						enabled: true,
						size: .custom(width: .infinity, height: 50),
						isLoading: .constant(false),
						onTap: {
							onSelected(.agreedToFees)
						}
					)

					TextButton(
						label: "No thanks, I'm out",
						enabled: true,
						size: .custom(width: .infinity, height: 40),
						alignment: .center,
						isLoading: .constant(false),
						onTap: {
							onSelected(.didNotAgreeToFees)
						}
					)
				}
				.offset(y: -40)
			}
			.padding([.leading, .trailing], 16)
		}
	}
}

var Subtitle: some View {
	let charge = Text("We charge a ")
		.font(AppFont.subtitle.getFont())
		.foregroundColor(AppFont.subtitle.getColor())

	let tinyFee = Text("tiny")
		.underline()
		.font(AppFont.subtitle.getFont())
		.foregroundColor(AppFont.subtitle.getColor())

	let transactions = Text(" fee for transactions over $50")
		.font(AppFont.subtitle.getFont())
		.foregroundColor(AppFont.subtitle.getColor())

	let concatenated = charge + tinyFee + transactions

	return concatenated.multilineTextAlignment(.center)
}

private struct FeeTableHeader: View {
	var body: some View {
		HStack(alignment: .center) {
			AppText("When you pay", font: .primaryText)
			Spacer()
			AppText("We charge", font: .primaryText)
		}
		.frameFillWidth(height: 24)
		.padding([.leading, .trailing], 16)
	}
}

private struct FeeRow: View {
	let icon: AppImage
	let transactionValue: String
	let serviceFee: String

	var body: some View {
		HStack(alignment: .center) {
			icon.image
			AppText(transactionValue, font: .subText)
			Spacer()
			AppText(serviceFee, font: .subText)
		}
		.frameFillWidth(height: 24)
		.padding([.leading, .trailing, .bottom], 16)
	}
}

struct DisclosureOfFees_Previews: PreviewProvider {
	static var previews: some View {
		DisclosureOfFees {
			print($0.rawValue)
		}
	}
}
