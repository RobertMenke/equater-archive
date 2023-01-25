//
//  OnBoardingTabView.swift
//  Equater
//
//  Created by Robert B. Menke on 9/2/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

/// Reference: https://developer.apple.com/tutorials/swiftui/interfacing-with-uikit
struct PagingView<Page: View>: UIViewControllerRepresentable {
	// MARK: - Properties

	@Binding var currentPage: Int
	var pages: [Page]
	var onPageChanged: (Int) -> Void

	init(currentPage: Binding<Int>, pages: [Page], onPageChanged: @escaping (Int) -> Void) {
		_currentPage = currentPage
		self.pages = pages
		self.onPageChanged = onPageChanged
	}

	// MARK: - View Controller Interop

	func makeUIViewController(context: Context) -> UIPageViewController {
		let pageViewController = UIPageViewController(
			transitionStyle: .scroll,
			navigationOrientation: .horizontal
		)

		pageViewController.dataSource = context.coordinator
		pageViewController.delegate = context.coordinator
		pageViewController.view.backgroundColor = AppColor.backgroundPrimary.uiColor
		pageViewController.view.subviews.forEach {
			if let scrollView = $0 as? UIScrollView {
				scrollView.isDirectionalLockEnabled = true
			}
		}

		return pageViewController
	}

	func updateUIViewController(_ pageViewController: UIPageViewController, context: Context) {
		var direction: UIPageViewController.NavigationDirection = .forward

		if let previousViewController = pageViewController.viewControllers?.first,
		   let previousPage = context.coordinator.controllers.firstIndex(of: previousViewController)
		{
			direction = (currentPage >= previousPage) ? .forward : .reverse
		}

		let currentViewController = context.coordinator.controllers[currentPage]
		pageViewController.setViewControllers(
			[currentViewController],
			direction: direction,
			animated: true
		)
	}

	func makeCoordinator() -> Coordinator {
		Coordinator(self)
	}

	// MARK: - Coordinator & UIViewController Delegates

	final class Coordinator: NSObject, UIPageViewControllerDataSource, UIPageViewControllerDelegate {
		var parent: PagingView
		var controllers = [UIViewController]()

		init(_ pageViewController: PagingView) {
			parent = pageViewController
			controllers = parent.pages.map { UIHostingController(rootView: $0) }
		}

		/// Handle progressing backwards in the page control
		/// return nil to indicate no more progress can be made in this direction
		func pageViewController(
			_ pageViewController: UIPageViewController,
			viewControllerBefore viewController: UIViewController
		) -> UIViewController? {
			guard let index = controllers.firstIndex(of: viewController) else {
				return nil
			}

			if index == 0 {
				return controllers.last
			}

			return controllers[index - 1]
		}

		/// Handle progressing forward in the page control
		/// return nil to indicate no more progress can be made in this direction
		func pageViewController(
			_ pageViewController: UIPageViewController,
			viewControllerAfter viewController: UIViewController
		) -> UIViewController? {
			guard let index = controllers.firstIndex(of: viewController) else {
				return nil
			}

			if index + 1 == controllers.count {
				return controllers.first
			}

			return controllers[index + 1]
		}

		/// Called when the view finishes animating. [completed] indicates whether
		/// or not the animation changed the visible view controller
		func pageViewController(
			_ pageViewController: UIPageViewController,
			didFinishAnimating finished: Bool,
			previousViewControllers: [UIViewController],
			transitionCompleted completed: Bool
		) {
			if completed,
			   let visibleViewController = pageViewController.viewControllers?.first,
			   let index = controllers.firstIndex(of: visibleViewController)
			{
				parent.currentPage = index
				parent.onPageChanged(index)
			}
		}
	}
}
