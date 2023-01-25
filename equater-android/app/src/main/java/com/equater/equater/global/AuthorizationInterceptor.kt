package com.equater.equater.global

import android.content.SharedPreferences
import com.equater.equater.BuildConfig
import com.equater.equater.extensions.EquaterPreference
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import timber.log.Timber
import java.net.SocketTimeoutException
import javax.inject.Inject

class AuthorizationInterceptor @Inject constructor(private val preferences: SharedPreferences) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        var request = chain.request()

        // We also use retrofit to make requests to AWS, in which case we should not add
        // an authorization header.
        if (isMakingRequestToEquaterApi(request)) {
            val authToken = preferences.getString(EquaterPreference.AuthBearerToken.preferenceName, null)
            authToken?.let { token ->
                request = request
                    .newBuilder()
                    .addHeader("Authorization", "Bearer $token")
                    .build()
            }
        }

        // SocketTimeoutException will crash the app if not caught & handled
        return try {
            chain.proceed(request)
        } catch (e: SocketTimeoutException) {
            Timber.e("${request.url}  -- $e")
            // Honestly not sure if this is a good approach. Doesn't seem to be much guidance online for handling this scenario.
            Response.Builder()
                .body("Socket timeout error".toResponseBody("text/plain".toMediaType()))
                .code(503)
                .message("Socket timeout error $e")
                .protocol(Protocol.HTTP_1_1)
                .request(request)
                .build()
        }
    }

    private fun isMakingRequestToEquaterApi(request: Request): Boolean {
        return request.url.host == BuildConfig.API_BASE.replace("https://", "")
    }
}
