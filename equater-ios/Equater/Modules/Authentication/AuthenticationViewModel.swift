//
//  OnBoardingViewModel.swift
//  Equater
//
//  Created by Robert B. Menke on 9/7/19.
//  Copyright © 2019 beauchampsullivan. All rights reserved.
//

import Combine
import Foundation
import Resolver
import SwiftEventBus
import SwiftUI
import Validator

enum AuthenticationFlow {
	case signIn
	case registration
}

private let ACCEPTED_TERMS_OF_SERVICE = "ACCEPTED_TERMS_OF_SERVICE"
private let ACCEPTED_PRIVACY_POLICY = "ACCEPTED_PRIVACY_POLICY"

final class AuthenticationViewModel: Identifiable, ObservableObject {
	@Injected var service: AuthenticationApi
	@Injected var deviceRegistrationService: DeviceRegistrationService
	@InjectedObject var appState: AppState

	@Published var currentStep = 0
	@Published var authFlowIsActive = false
	@Published var authFlow = AuthenticationFlow.registration
	@Published var email = ""
	@Published var password = ""
	@Published var registrationPasswordError = ""
	@Published var registrationRequestInProgress = false
	@Published var signInPasswordError = ""
	@Published var signInRequestInProgress = false
	@Published var emailIsValid = false
	@Published var passwordIsValid = false
	/// We don't want to display these to the user due to some race condition
	@Published var acceptedTermsOfService = true
	@Published var acceptedPrivacyPolicy = true

	private var disposables = Set<AnyCancellable>()

	let emailValidationRule = ValidationRulePattern(
		pattern: EmailValidationPattern.standard,
		error: InputError("Invalid email address")
	)

	/// listen for changes in email/password in order to
	/// determine if they're valid
	init() {
		$email
			.dropFirst()
			.map(isValidEmail(email:))
			.sink(receiveValue: { isValid in
				self.emailIsValid = isValid
			})
			.store(in: &disposables)

		$password
			.dropFirst()
			.sink(receiveValue: { password in
				self.passwordIsValid = password.count >= MIN_PASSWORD_LENGTH
			})
			.store(in: &disposables)

		// If the user is signed in and the server indicates that they haven't accepted
		// the legal docs keep trying to accept them silently in the background
		SwiftEventBus.onMainThread(self, name: Event.userIsSignedIn.rawValue) { _ in
			guard let user = self.appState.user else { return }
			self.acceptedTermsOfService = user.acceptedTermsOfService ? true : UserDefaults.standard.bool(forKey: "\(ACCEPTED_TERMS_OF_SERVICE)-\(user.id)")
			self.acceptedPrivacyPolicy = user.acceptedPrivacyPolicy ? true : UserDefaults.standard.bool(forKey: "\(ACCEPTED_PRIVACY_POLICY)-\(user.id)")

			// Dispatch this after the fact because published variables update on the next tick
			DispatchQueue.global().async {
				let serverHasNotRecievedLegalDocAcceptance = !user.acceptedTermsOfService || !user.acceptedPrivacyPolicy
				let clientHasAcceptedLegalDocs = self.acceptedTermsOfService && self.acceptedPrivacyPolicy

				if !serverHasNotRecievedLegalDocAcceptance, clientHasAcceptedLegalDocs {
					self.patchLegalDocAcceptance()
				}
			}
		}
	}

	/// Very basic email regex. Real validation will come from
	/// verification of the confirmation email we send out.
	private func isValidEmail(email: String) -> Bool {
		let result = email
			.trimmingCharacters(in: .whitespaces)
			.validate(rule: emailValidationRule)

		switch result {
		case .valid: return true
		case .invalid: return false
		}
	}

	/// Fetch the environment details and keep trying every second until they're available
	func fetchEnvironment(_ completion: @escaping (EnvironmentDetails) -> Void) {
		service
			.fetchEnvironment()
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { [weak self] value in
					guard self != nil else { return }
					switch value {
					case .failure(let err):
						logger.error("\(err.localizedDescription)")
						DispatchQueue.global().asyncAfter(deadline: .now() + 1) {
							self?.fetchEnvironment(completion)
						}
					default:
						break
					}
				},
				receiveValue: { [weak self] response in
					guard self != nil else { return }
					if let body = response.body {
						logger.console("Server environment is \(body.serverEnvironment)")
						logger.console("Plaid environment is \(body.plaidEnvironment)")
						logger.addAttribute(forKey: "environment", value: body.serverEnvironment)
						logger.addAttribute(forKey: "plaidEnvironment", value: body.plaidEnvironment)
						DispatchQueue.main.async {
							completion(body)
						}
					} else {
						DispatchQueue.global().asyncAfter(deadline: .now() + 1) {
							self?.fetchEnvironment(completion)
						}
					}
				}
			)
			.store(in: &disposables)
	}

	func requestPasswordReset() {
		let request = ResetPasswordDto(email: email.trimmingCharacters(in: .whitespacesAndNewlines))

		service
			.requestPasswordReset(request)
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { [weak self] value in
					guard self != nil else { return }
					switch value {
					case .failure(let err):
						logger.error("Password reset request failed with \(err.localizedDescription)")
					case .finished:
						logger.console("Password reset request succeeded")
					}
				},
				receiveValue: { [weak self] response in
					guard self != nil else { return }
					logger.console("Password reset request responded with \(String(describing: response.status))")
				}
			)
			.store(in: &disposables)
	}

	func resendEmailConfirmation(_ completion: @escaping (AppError?) -> Void) {
		guard let user = appState.user else {
			return
		}

		service
			.resendEmailConfirmation(EmailDto(email: user.email))
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { value in
					switch value {
					case .failure(let err):
						logger.error("\(err.localizedDescription)")
						completion(err)
					case .finished:
						break
					}
				},
				receiveValue: { response in
					guard let err = response.error else {
						completion(nil)
						return
					}

					completion(.networkError(err))
				}
			)
			.store(in: &disposables)
	}

	/// TODO: The error case here needs a lot of QA to ensure we can trust both our server's
	/// TODO: responses and the device's handling of errors
	func registerUser() {
		let request = AuthenticationDto(email: getEmail(), password: password)

		service
			.register(request)
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { [weak self] value in
					guard let self = self else { return }
					switch value {
					case .failure(let err):
						logger.error("REGISTRATION ERROR \(err.localizedDescription)")
						DispatchQueue.main.async {
							self.registrationPasswordError = ErrorResponse.defaultErrorMessage
						}
						self.registrationRequestInProgress = false
					case .finished:
						break
					}
				},
				receiveValue: { [weak self] response in
					guard let self = self else { return }

					if let dto = response.body {
						withAnimation {
							self.appState.set(signInResponse: dto)
						}

						DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
							showSnackbar(message: "We sent you an email to verify your account.")
						}
					} else if let error = response.error {
						DispatchQueue.main.async {
							self.registrationPasswordError = error
						}
					}

					self.registrationRequestInProgress = false
				}
			)
			.store(in: &disposables)
	}

	/// TODO: The error case here needs a lot of QA to ensure we can trust both our server's
	/// TODO: responses and the device's handling of errors
	func signIn() {
		let request = AuthenticationDto(email: getEmail(), password: password)

		service
			.signIn(request)
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { [weak self] value in
					guard let self = self else { return }
					switch value {
					case .failure(let err):
						logger.error("REGISTRATION ERROR \(err.localizedDescription)")
						withAnimation {
							self.signInPasswordError = "Invalid username or password"
						}
						self.signInRequestInProgress = false
					case .finished:
						break
					}
				},
				receiveValue: { [weak self] response in
					guard let self = self else { return }
					if let dto = response.body {
						withAnimation {
							self.appState.set(signInResponse: dto)
						}
					} else if response.status >= 400, response.status < 500 {
						withAnimation {
							self.signInPasswordError = "Invalid username or password"
						}
					} else if let error = response.error {
						logger.error(error)
						withAnimation {
							self.signInPasswordError = "Invalid username or password"
						}
					}

					self.signInRequestInProgress = false
				}
			)
			.store(in: &disposables)
	}

	func syncUserState() {
		service
			.getUser()
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { value in
					switch value {
					case .failure(let err):
						logger.error("\(err.localizedDescription)")
					case .finished:
						break
					}
				},
				receiveValue: { [weak self] response in
					if response.status == 403 || response.status == 404 {
						DispatchQueue.main.async {
							self?.appState.signOut()
							logger.warn("Signing out due to invalid auth token -- status code \(response.status)")
						}

						return
					}

					if let user = response.body {
						DispatchQueue.main.async {
							self?.appState.set(user: user)
						}
					}
				}
			)
			.store(in: &disposables)
	}

	func patchLegalDocAcceptance() {
		let dto = PatchLegalDocsDto(
			acceptedTermsOfService: acceptedTermsOfService,
			acceptedPrivacyPolicy: acceptedPrivacyPolicy
		)

		service
			.patchLegalDocAcceptance(dto)
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { value in
					switch value {
					case .failure(let err):
						logger.error("\(err.localizedDescription)")
					case .finished:
						break
					}
				},
				receiveValue: { [weak self] response in
					if response.status == 403 || response.status == 404 {
						logger.error("Failed to patch legal doc acceptance", error: nil)
						return
					}

					if let user = response.body {
						DispatchQueue.main.async {
							self?.appState.set(user: user)
						}
					}
				}
			)
			.store(in: &disposables)
	}

	func permanentlyDeleteAccount(userId: UInt, completion: @escaping () -> Void) {
		service
			.permanentlyDeleteAccount(userId)
			.receive(on: DispatchQueue.main)
			.sink(
				receiveCompletion: { [weak self] value in
					guard self != nil else { return }
					switch value {
					case .failure(let err):
						logger.error("Account deletion failed with \(err.localizedDescription)")
					case .finished:
						logger.console("Account deletion finished for user \(userId)")
					}
				},
				receiveValue: { [weak self] response in
					guard self != nil else { return }
					completion()
					logger.console("Account deletion responded with status \(response.status)")
				}
			)
			.store(in: &disposables)
	}

	func set(hasAcceptedTerms accepted: Bool) {
		guard let user = appState.user else { return }
		acceptedTermsOfService = accepted
		UserDefaults.standard.set(accepted, forKey: "\(ACCEPTED_TERMS_OF_SERVICE)-\(user.id)")

		if acceptedTermsOfService, acceptedPrivacyPolicy {
			patchLegalDocAcceptance()
		}

		print("terms \(acceptedTermsOfService) -- privacy \(acceptedPrivacyPolicy)")
	}

	func set(hasAcceptedPrivacyPolicy accepted: Bool) {
		guard let user = appState.user else { return }
		acceptedPrivacyPolicy = accepted
		UserDefaults.standard.set(accepted, forKey: "\(ACCEPTED_PRIVACY_POLICY)-\(user.id)")

		if acceptedTermsOfService, acceptedPrivacyPolicy {
			patchLegalDocAcceptance()
		}

		print("terms \(acceptedTermsOfService) -- privacy \(acceptedPrivacyPolicy)")
	}

	private func getEmail() -> String {
		email.trimmingCharacters(in: .whitespaces)
	}
}
