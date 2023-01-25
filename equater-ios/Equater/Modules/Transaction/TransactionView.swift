//
//  TransactionView.swift
//  Equater
//
//  Created by Robert B. Menke on 7/4/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Introspect
import Resolver
import SwiftEventBus
import SwiftUI

struct TransactionView: View {
	@InjectedObject private var viewModel: TransactionViewModel

	var body: some View {
		Window {
			VStack {
				if self.viewModel.hasFetchedInitialData {
					TransactionList
				} else {
					ActivityIndicator(isAnimating: .constant(true), style: .large)
						.frameFillWidth(height: 300, alignment: .center)
				}
			}
			.padding([.leading, .trailing], 12)
			.padding(.top, 8)
		}
	}

	var TransactionFilter: some View {
		ScrollView(.horizontal) {
			HStack(spacing: 8) {
				ForEach(viewModel.transactionFilterList) { (filter: TransactionFilter) in
					TransactionFilterLogo(viewModel: viewModel, filter: filter)
						.padding(.all, 4)
				}
			}
			.frameFillWidth(height: 60 + 16 + 16, alignment: .center)
		}
		.padding([.top, .bottom], 16)
	}

	var TransactionList: some View {
		ScrollView {
			Group {
				if viewModel.transactions.count > 0 {
					TransactionFilter
					VStack(spacing: 10) {
						ForEach(viewModel.filteredTransactions) { story in
							TransactionItemView(story: story)
								.padding([.leading, .trailing], 2)
						}
					}
				} else {
					NoDataFound(text: "No transactions found")
						.padding(.top, 36)
				}
			}
		}
		.introspectScrollView { scrollView in
			scrollView.refreshControl = UIRefreshControl()
			scrollView.refreshControl?.addTarget(
				self.viewModel,
				action: #selector(TransactionViewModel.handleRefresh(sender:)),
				for: .valueChanged
			)
		}
	}
}

private struct TransactionFilterLogo: View {
	var viewModel: TransactionViewModel
	var filter: TransactionFilter
	@State var bgWidth = 65
	@State var bgHeight = 65
	@State var isActive = false

	var body: some View {
		VStack {
			switch filter {
			case .merchant(let vendor):
				RemoteAvatar(
					photo: .vendorLogo(vendor: vendor),
					makeFallbackImage: { DefaultVendorImage() },
					onTap: {
						if viewModel.transactionFilter == filter {
							viewModel.setTransactionFilter(.none)
						} else {
							viewModel.setTransactionFilter(filter)
						}
					}
				)
				.onAppear {
					SwiftEventBus.onMainThread(viewModel, name: Event.transactionFilterSelected.rawValue) { _ in
						isActive = viewModel.transactionFilter == filter
					}
				}
				.typeErased
			case .recurring:
				AppImage.clockIconClipped.image.resizable().frame(width: 60, height: 60)
					.onAppear {
						SwiftEventBus.onMainThread(viewModel, name: Event.transactionFilterSelected.rawValue) { _ in
							isActive = viewModel.transactionFilter == filter
						}
					}
					.onTapGesture {
						if viewModel.transactionFilter == filter {
							viewModel.setTransactionFilter(.none)
						} else {
							viewModel.setTransactionFilter(filter)
						}
					}
					.onAppear {
						SwiftEventBus.onMainThread(viewModel, name: Event.transactionFilterSelected.rawValue) { _ in
							isActive = viewModel.transactionFilter == filter
						}
					}
					.typeErased
			case .none:
				AppImage.clockIconClipped.image.resizable().frame(width: 60, height: 60).typeErased
			}
		}
		.frame(width: 70, height: 70, alignment: .center)
		.overlay(RoundedRectangle(cornerRadius: 4).stroke(AppColor.textPrimary.color, lineWidth: isActive ? 4 : 0))
		.onAppear {
			isActive = viewModel.transactionFilter == filter
		}
	}
}

struct TransactionView_Previews: PreviewProvider {
	static var previews: some View {
		TransactionView()
	}
}
