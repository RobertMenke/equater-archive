//
//  TextView.swift
//  Equater
//
//  Created by Robert B. Menke on 1/17/21.
//  Copyright © 2021 beauchampsullivan. All rights reserved.
//

import SwiftUI

/// README: I'm moving quickly here and this particular
/// implementation is just needed for the 1 and only multi-line
/// text field in the app. It's not perfect, but it gets the job done for now
/// taken from https://stackoverflow.com/a/58639072/4313362
/// in ios 14 we can move to the native TextEditor
private struct UITextViewWrapper: UIViewRepresentable {
	typealias UIViewType = UITextView

	@Binding var text: String
	@Binding var calculatedHeight: CGFloat
	var onDone: (() -> Void)?

	func makeUIView(context: UIViewRepresentableContext<UITextViewWrapper>) -> UITextView {
		let textField = UITextView()
		textField.delegate = context.coordinator

		textField.isEditable = true
		textField.font = UIFont.preferredFont(forTextStyle: .body)
		textField.isSelectable = true
		textField.isUserInteractionEnabled = true
		textField.isScrollEnabled = false
		textField.backgroundColor = UIColor.clear
		textField.textContainerInset = UIEdgeInsets(top: 16, left: 16, bottom: 16, right: 16)
		if onDone != nil {
			textField.returnKeyType = .done
		}

		textField.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
		return textField
	}

	func updateUIView(_ uiView: UITextView, context: UIViewRepresentableContext<UITextViewWrapper>) {
		if uiView.text != text {
			uiView.text = text
		}
		if uiView.window != nil, !uiView.isFirstResponder {
			DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
				uiView.becomeFirstResponder()
			}
		}
		UITextViewWrapper.recalculateHeight(view: uiView, result: $calculatedHeight)
	}

	fileprivate static func recalculateHeight(view: UIView, result: Binding<CGFloat>) {
		let newSize = view.sizeThatFits(CGSize(width: view.frame.size.width, height: CGFloat.greatestFiniteMagnitude))
		if result.wrappedValue != newSize.height {
			DispatchQueue.main.async {
				result.wrappedValue = newSize.height // !! must be called asynchronously
			}
		}
	}

	func makeCoordinator() -> Coordinator {
		Coordinator(text: $text, height: $calculatedHeight, onDone: onDone)
	}

	final class Coordinator: NSObject, UITextViewDelegate {
		var text: Binding<String>
		var calculatedHeight: Binding<CGFloat>
		var onDone: (() -> Void)?

		init(text: Binding<String>, height: Binding<CGFloat>, onDone: (() -> Void)? = nil) {
			self.text = text
			calculatedHeight = height
			self.onDone = onDone
		}

		func textViewDidChange(_ uiView: UITextView) {
			text.wrappedValue = uiView.text
			UITextViewWrapper.recalculateHeight(view: uiView, result: calculatedHeight)
		}

		func textView(_ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
			if let onDone = onDone, text == "\n" {
				textView.resignFirstResponder()
				onDone()
				return false
			}
			return true
		}
	}
}

struct MultilineTextField: View {
	private var placeholder: String
	private var onCommit: (() -> Void)?

	@Binding private var text: String
	private var internalText: Binding<String> {
		Binding<String>(get: { self.text }) {
			self.text = $0
			self.showingPlaceholder = $0.isEmpty
		}
	}

	@State private var dynamicHeight: CGFloat = 100
	@State private var showingPlaceholder = false

	init(_ placeholder: String = "", text: Binding<String>, onCommit: (() -> Void)? = nil) {
		self.placeholder = placeholder
		self.onCommit = onCommit
		_text = text
		_showingPlaceholder = State<Bool>(initialValue: self.text.isEmpty)
	}

	var body: some View {
		UITextViewWrapper(text: self.internalText, calculatedHeight: $dynamicHeight, onDone: onCommit)
			.frame(minHeight: dynamicHeight, maxHeight: dynamicHeight)
			.background(placeholderView, alignment: .topLeading)
	}

	var placeholderView: some View {
		Group {
			if showingPlaceholder {
				Text(placeholder).foregroundColor(.gray)
					.padding(.leading, 21)
					.padding(.top, 16)
			}
		}
	}
}
