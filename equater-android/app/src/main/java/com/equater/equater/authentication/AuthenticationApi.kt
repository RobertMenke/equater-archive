package com.equater.equater.authentication

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT

interface AuthenticationApi {
    @GET("/api/user")
    suspend fun fetchUser(): Response<User>

    @GET("/api/environment")
    suspend fun fetchEnvironmentDetails(): Response<EnvironmentDetails>

    @PUT("/api/auth/register")
    suspend fun register(@Body request: SignInRequest): Response<SignInResponse>

    @POST("/api/auth/login")
    suspend fun signIn(@Body request: SignInRequest): Response<SignInResponse>

    @POST("/api/auth/request-password-reset")
    suspend fun requestPasswordReset(@Body dto: ResetPasswordDto): Response<Unit>

    @POST("/api/auth/resend-email-verification")
    suspend fun resendEmailConfirmation(@Body dto: EmailDto): Response<Unit>
}
