//
//  LottieView.swift
//  Equater
//
//  Created by Robert B. Menke on 7/9/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Lottie
import SwiftUI

struct LottieView: UIViewRepresentable {
	typealias UIViewType = UIView

	var fileName: String
	var loopMode: LottieLoopMode
	var editView: ((AnimationView) -> Void)?

	/// https://edit.lottiefiles.com/?src=https%3A%2F%2Fassets5.lottiefiles.com%2Fpackages%2Flf20_XyfCyq.json
	static func levitatingFinanceMan() -> LottieView {
		LottieView(
			fileName: "levitating-finances",
			loopMode: .autoReverse,
			editView: { animationView in
				let keyPaths = [
					"Tronco.Group 4.Group 2.Fill 1.Color",
					"Brazo derecho.Group 2.Group 2.Fill 1.Color",
					"Brazo izquierdo.Group 2.Group 2.Fill 1.Color",
				]
				keyPaths.forEach {
					let keypath = AnimationKeypath(keypath: $0)
					let greenValueProvider = ColorValueProvider(Color(r: 122 / 255, g: 4 / 255, b: 235 / 255, a: 1))
					animationView.setValueProvider(greenValueProvider, keypath: keypath)
				}
			}
		)
	}

	static func sharedBillAnimation() -> LottieView {
		LottieView(
			fileName: "SharedBillAgreementAnimation",
			loopMode: .loop
		)
	}

	func makeUIView(context: UIViewRepresentableContext<LottieView>) -> UIView {
		let view = UIView(frame: .zero)
		let animationView = AnimationView()
		let animation = Lottie.Animation.named(fileName)
		animationView.animation = animation
		animationView.contentMode = .scaleAspectFit
		animationView.loopMode = loopMode
		animationView.play()

		animationView.translatesAutoresizingMaskIntoConstraints = false
		view.addSubview(animationView)
		NSLayoutConstraint.activate([
			animationView.widthAnchor.constraint(equalTo: view.widthAnchor),
			animationView.heightAnchor.constraint(equalTo: view.heightAnchor),
			animationView.topAnchor.constraint(equalTo: view.topAnchor),
			animationView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
		])

		editView?(animationView)

		return view
	}

	func updateUIView(_ uiView: UIView, context: UIViewRepresentableContext<LottieView>) {}

	func makeCoordinator() -> Coordinator {
		Coordinator(self)
	}

	final class Coordinator: NSObject {
		private let view: LottieView

		init(_ view: LottieView) {
			self.view = view
		}
	}
}

struct LottieView_Previews: PreviewProvider {
	static var previews: some View {
		LottieView.levitatingFinanceMan()
	}
}
