package com.equater.equater.global

import com.equater.equater.authentication.SignInResponse

sealed class Event
class SignInEvent(val signInResponse: SignInResponse) : Event()
object SignOutEvent : Event()
