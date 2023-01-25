package com.equater.equater.authentication

sealed class SignInState

object SignedOut : SignInState()
class SignedIn(val user: User, val authToken: String) : SignInState()
