package com.equater.equater.extensions

import arrow.core.continuations.nullable
import org.json.JSONObject
import retrofit2.HttpException
import timber.log.Timber

fun HttpException.shouldShowEmailConfirmation(): Boolean {
    try {
        val message = nullable.eager {
            val error = response()?.errorBody().bind()
            val json = JSONObject(error.string())
            if (json.has("message")) {
                json.getString("message")
            } else {
                null
            }
        }

        return message == "email-confirmation-required"
    } catch (e: Throwable) {
        Timber.e(e)
        return false
    }
}
