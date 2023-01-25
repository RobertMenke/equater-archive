//
//  AgreementDetailView.swift
//  Equater
//
//  Created by Robert B. Menke on 6/28/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct AgreementDetailView: View {
	@Environment(\.presentationMode) var presentationMode: Binding<PresentationMode>
	@InjectedObject private var viewModel: AgreementsViewModel
	@InjectedObject private var transactionViewModel: TransactionViewModel
	@InjectedObject private var homeScreenViewModel: HomeScreenViewModel
	@InjectedObject private var appState: AppState
	@State var story: SharedExpenseStory
	// From some screens we may want to limit the option to navigate elsewhere (like to the transactions screen)
	// This will hopefully be refactored at some point when navigation is simplified. For now,
	// it's quite complicated to handle arbitrary navigation across `NavigationView` instances.
	var allowNavigationActions = true
	@State var sheetIsShown = false
	@State private var declineIsLoading = false

	var body: some View {
		Window {
			ZStack {
				AgreementDetail(story: self.$story, sheetIsShown: $sheetIsShown)
				AgreementAction(story: self.$story, declineIsLoading: self.$declineIsLoading)
			}
		}
		.offset(y: 0)
		.navigationBarBackButtonHidden(true)
		.navigationBarTitle(Text(""), displayMode: .inline)
		.navigationBarItems(leading: Button(
			action: {
				/// This is a little bit of a hack. We avoid updating the view model until
				/// the detail view is about to be dismissed since updated the story's status
				/// from pending/inactive/active can bring it out of the ForEach component
				/// that holds a reference to the view. This fixes an undesirable behavior
				/// where the framework would automatically navigate back thinking that the
				/// underlying data structure had disappeared.
				DispatchQueue.main.async {
					viewModel.update(story: story)
					viewModel.moveToStoryTab(story)
				}

				self.presentationMode.wrappedValue.dismiss()
			},
			label: {
				HStack {
					Image(systemName: "chevron.left")
						.font(.system(size: 16, weight: .medium))
						.foregroundColor(AppColor.accentPrimaryForText.color)

					AppText("Back", font: .custom(size: 16.0, color: .accentPrimaryForText))
				}
				.frame(width: 80, height: 40)
			}
		))
		.withSheet(visible: $sheetIsShown, sheetContent: {
			if story.sharedExpense.isActive && allowNavigationActions {
				MenuItem(icon: .cardSuccess, text: "View Transactions") {
					HapticEngine.shared.play(.buttonTap)
					sheetIsShown = false
					DispatchQueue.main.async {
						self.viewModel.update(story: self.story)
					}

					self.presentationMode.wrappedValue.dismiss()

					if story.sharedExpense.sharedExpenseType == .transactionWebHook, let vendor = story.vendor {
						transactionViewModel.setTransactionFilter(.merchant(vendor: vendor))
					} else {
						transactionViewModel.setTransactionFilter(.recurring)
					}

					homeScreenViewModel.setTab(.viewTransactions)
				}
			}

			if story.sharedExpense.isPending || story.sharedExpense.isActive {
				MenuItem(icon: .userCancel, text: "Cancel Agreement") {
					HapticEngine.shared.play(.buttonTap)
					sheetIsShown = false
					declineIsLoading = true
					self.viewModel.updateAgreement(forStory: story, doesAccept: false) { response in
						self.declineIsLoading = false
						guard let updatedStory = response?.body else {
							if response?.requiresEmailConfirmation() ?? false {
								self.viewModel.showSheet = true
								return
							}

							showSnackbar(message: "Unable to cancel agreement. Please contact support.")
							return
						}

						showSnackbar(message: "Agreement has been canceled and is not active")
						self.story = updatedStory
						DispatchQueue.global(qos: .default).async {
							guard let user = appState.user else { return }
							if story.initiatingUser.id == user.id {
								logger.info("Shared expense agreement with id \(story.id) canceled by \(user.id)")
							}
							if let agreement = viewModel.getAgreement(forStory: self.story) {
								logger.info("Agreement with id \(agreement.id) canceled by \(user.id)")
							}
						}
					}
				}
			}

			MenuItem(icon: .closeIconColorFilled, text: "Close") {
				HapticEngine.shared.play(.buttonTap)
				sheetIsShown = false
			}
		})
	}

	var TitleText: Text {
		Text(story.sharedExpense.expenseNickName)
			.font(.custom("Inter", size: 36))
			.foregroundColor(AppColor.textPrimary.color)
			.bold()
	}
}

struct AgreementDetailView_Previews: PreviewProvider {
	static var previews: some View {
		AgreementDetailView(story: sharedExpenseStoryFake)
	}
}
