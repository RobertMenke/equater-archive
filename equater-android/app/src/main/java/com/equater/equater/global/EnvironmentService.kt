package com.equater.equater.global

import com.equater.equater.BuildConfig

object EnvironmentService {
    fun getWebUrl(endpoint: String): String = "${BuildConfig.WEB_BASE}$endpoint"
    fun getSupportPhoneNumber() = BuildConfig.SUPPORT_PHONE_NUMBER
    fun getSupportEmail() = BuildConfig.SUPPORT_EMAIL_ADDRESS
    fun isProduction() = BuildConfig.ENVIRONMENT == "production"
}
