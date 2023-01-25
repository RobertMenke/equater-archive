package com.equater.equater.linkBankAccount

import com.equater.equater.authentication.UserAccount
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.Path

interface UserAccountApi {
    @PATCH("/api/account/link-bank-account")
    suspend fun linkBankAccount(@Body dto: PlaidLinkResponse): Response<PatchBankAccountResponse>

    @PATCH("/api/account/{id}/unlink-bank-account")
    suspend fun unlinkBankAccount(@Path("id") id: Int): Response<PatchBankAccountResponse>

    @PATCH("/api/account/{id}/update-bank-account")
    suspend fun updateBankAccount(@Path("id") id: Int): Response<UserAccount>

    @GET("/api/account")
    suspend fun fetchUserAccounts(): Response<List<UserAccount>>
}
