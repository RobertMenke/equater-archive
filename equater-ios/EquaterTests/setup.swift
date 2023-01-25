//
//  setup.swift
//  EquaterTests
//
//  Created by Robert B. Menke on 4/26/20.
//  Copyright © 2020 beauchampsullivan. All rights reserved.
//

@testable import Equater
import Foundation
import Resolver

func createTestingDoubles() {
	fakeRestServices()
}

func resetTestingState() {
	AuthenticationRestServiceFake.requestShouldFail = false
	PlaidRestServiceFake.requestShouldFail = false
	DeviceRegistrationServiceFake.requestShouldFail = false
	PhotoUploadServiceFake.requestShouldFail = false
	UserSearchRestServiceFake.requestShouldFail = false
	VendorSearchRestServiceFake.requestShouldFail = false
	VerifiedCustomerRestServiceFake.requestShouldFail = false
	SharedExpenseRestServiceFake.requestShouldFail = false
}

private func fakeRestServices() {
	Resolver
		.register { AuthenticationRestServiceFake() }
		.implements(AuthenticationApi.self)
		.scope(Resolver.application)

	Resolver
		.register { PlaidRestServiceFake() }
		.implements(PlaidRestApi.self)
		.scope(Resolver.application)

	Resolver
		.register { DeviceRegistrationServiceFake() }
		.implements(DeviceRegistrationApi.self)
		.scope(Resolver.application)

	Resolver
		.register { PhotoUploadServiceFake() }
		.implements(PhotoUploadApi.self)
		.scope(Resolver.application)

	Resolver
		.register { UserSearchRestServiceFake() }
		.implements(UserSearchApi.self)
		.scope(Resolver.application)

	Resolver
		.register { VendorSearchRestServiceFake() }
		.implements(VendorSearchApi.self)
		.scope(Resolver.application)

	Resolver
		.register { VerifiedCustomerRestServiceFake() }
		.implements(VerifiedCustomerApi.self)
		.scope(Resolver.application)

	Resolver
		.register { SharedExpenseRestServiceFake() }
		.implements(SharedExpenseApi.self)
		.scope(Resolver.application)

	Resolver
		.register { OnBoardingRestServiceFake() }
		.implements(OnBoardingApi.self)
		.scope(Resolver.application)
}
