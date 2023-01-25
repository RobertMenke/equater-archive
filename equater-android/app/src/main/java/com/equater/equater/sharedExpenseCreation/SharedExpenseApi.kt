package com.equater.equater.sharedExpenseCreation

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.PUT
import retrofit2.http.Path

interface SharedExpenseApi {
    @PUT("/api/expense/shared-bill")
    suspend fun createMerchantSharedExpense(@Body dto: SharedBillDto): Response<SharedExpenseStory>

    @PUT("/api/expense/recurring-payment")
    suspend fun createRecurringSharedExpense(@Body dto: ScheduledPaymentDto): Response<SharedExpenseStory>

    @GET("/api/expense/user/{id}")
    suspend fun fetchSharedExpenses(@Path("id") id: Int): Response<List<SharedExpenseStory>>

    @GET("/api/expense/user/transactions/{id}")
    suspend fun fetchTransactions(@Path("id") id: Int): Response<List<TransactionStory>>

    @PATCH("/api/expense/agreement")
    suspend fun updateExpenseAgreement(@Body dto: UserAgreementDto): Response<SharedExpenseStory>

    @PATCH("/api/expense/deactivate/{id}")
    suspend fun cancelAgreement(@Path("id") id: Int, @Body dto: CancelAgreementDto): Response<SharedExpenseStory>
}
