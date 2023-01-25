//
//  ProfileInstructions.swift
//  Equater
//
//  Created by Robert B. Menke on 5/17/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import SwiftUI

struct ProfileInstructions: View {
	var body: some View {
		VStack(alignment: .leading) {
			AppText("Nice! You’re signed up.", font: .title)
			AppText("Now, take a moment to fill out your profile.", font: .subtitle).fixedSize(horizontal: false, vertical: true)
		}
		.frameFillWidth(height: nil)
		.padding(.top, 32)
		.padding(.bottom, 32)
	}
}

struct ProfileInstructions_Previews: PreviewProvider {
	static var previews: some View {
		ProfileInstructions()
	}
}
