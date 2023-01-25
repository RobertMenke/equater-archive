//
//  SelectedUserSection.swift
//  Equater
//
//  Created by Robert B. Menke on 2/16/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

import Resolver
import SwiftUI

struct SelectedUserSection: View {
	@InjectedObject var viewModel: UserSearchViewModel

	var body: some View {
		TitleDividerSection(
			title: "Selected",
			component: SelectedUserList()
		)
	}
}

struct SelectedUserSection_Previews: PreviewProvider {
	static var previews: some View {
		SelectedUserSection()
	}
}
