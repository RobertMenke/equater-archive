package com.equater.equater.extensions

import android.content.SharedPreferences
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.PropertyNamingStrategies
import com.fasterxml.jackson.module.kotlin.KotlinFeature
import com.fasterxml.jackson.module.kotlin.KotlinModule
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import timber.log.Timber

val objectMapper = createObjectMapper()

enum class EquaterPreference(val preferenceName: String) {
    User("USER"),
    UserAccount("USER_ACCOUNT"),
    PaymentAccount("PAYMENT_ACCOUNT"),
    HasSeenWalkThrough("HAS_SEEN_WALK_THROUGH"),
    AuthBearerToken("AUTH_BEARER_TOKEN"),
    AcceptedTerms("ACCEPTED_TERMS"),
    AcceptedPrivacyPolicy("ACCEPTED_PRIVACY_POLICY"),
    ApiBase("API_BASE"),
    EnvironmentDetails("ENVIRONMENT_DETAILS");

    fun keyedWithUser(user: com.equater.equater.authentication.User) = "$preferenceName-${user.id}"
}

inline fun <reified T> SharedPreferences.getJson(key: String): T? {
    val value = getString(key, "")

    if (value != null) {
        return objectMapper.parseJson(value)
    }

    return null
}

inline fun <reified T> SharedPreferences.putJson(key: String, value: T) {
    val json = serializeJson(value)
    edit().putString(key, json).apply()
}

inline fun <reified T> ObjectMapper.parseJson(value: String): T? {
    return try {
        readValue(value, T::class.java)
    } catch (e: Throwable) {
        Timber.e(e)
        return null
    }
}

fun <T> serializeJson(value: T): String? {
    return try {
        objectMapper.writeValueAsString(value)
    } catch (e: Throwable) {
        Timber.e(e)
        return null
    }
}

fun createObjectMapper(): ObjectMapper {
    return jacksonObjectMapper()
        .registerModule(
            KotlinModule.Builder()
                .configure(KotlinFeature.NullToEmptyCollection, true)
                .configure(KotlinFeature.NullToEmptyMap, false)
                .configure(KotlinFeature.NullIsSameAsDefault, true)
                .configure(KotlinFeature.StrictNullChecks, false)
                .build()
        )
        .setPropertyNamingStrategy(
            PropertyNamingStrategies.LOWER_CAMEL_CASE
        )
}
