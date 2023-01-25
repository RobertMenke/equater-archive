package com.equater.equater.database.repository

import com.equater.equater.database.dao.AgreementDao
import com.equater.equater.sharedExpenseCreation.CancelAgreementDto
import com.equater.equater.sharedExpenseCreation.ScheduledPaymentDto
import com.equater.equater.sharedExpenseCreation.SharedBillDto
import com.equater.equater.sharedExpenseCreation.SharedExpenseApi
import com.equater.equater.sharedExpenseCreation.SharedExpenseStory
import com.equater.equater.sharedExpenseCreation.UserAgreementDto
import com.equater.equater.sharedExpenseCreation.toEntity
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.mapLatest
import retrofit2.HttpException
import javax.inject.Inject

class AgreementRepository @Inject constructor(
    private val api: SharedExpenseApi,
    private val dao: AgreementDao
) {
    // ///////////////////////////////
    // Database
    // ///////////////////////////////
    @OptIn(ExperimentalCoroutinesApi::class)
    fun observeAgreements(userId: Int): Flow<List<SharedExpenseStory>> {
        return dao.observeAgreementsForUser(userId)
            .distinctUntilChanged()
            .mapLatest { agreements -> agreements.map { it.story } }
    }

    suspend fun insertAgreement(userId: Int, story: SharedExpenseStory) {
        val entity = story.toEntity(userId)
        dao.upsert(entity = entity)
    }

    suspend fun findAgreement(id: Int): SharedExpenseStory? {
        val entity = dao.findAgreement(id)

        return entity?.story
    }

    // ///////////////////////////////
    // HTTP API
    // ///////////////////////////////
    suspend fun createSharedBill(authenticatedUserId: Int, dto: SharedBillDto): SharedExpenseStory {
        val response = api.createMerchantSharedExpense(dto)
        val agreement = response.body()

        if (!response.isSuccessful || agreement == null) {
            throw HttpException(response)
        }

        insertAgreement(authenticatedUserId, agreement)

        return agreement
    }

    suspend fun createScheduledPayment(authenticatedUserId: Int, dto: ScheduledPaymentDto): SharedExpenseStory {
        val response = api.createRecurringSharedExpense(dto)
        val agreement = response.body()

        if (!response.isSuccessful || agreement == null) {
            throw HttpException(response)
        }

        insertAgreement(authenticatedUserId, agreement)

        return agreement
    }

    /**
     * Fetch expenses from the server and rehydrate the local DB
     */
    suspend fun fetchSharedExpenses(userId: Int): List<SharedExpenseStory> {
        val response = api.fetchSharedExpenses(userId)
        val agreements = response.body() ?: return listOf()
        val entities = agreements.map { it.toEntity(userId) }

        if (entities.isNotEmpty()) {
            dao.upsert(entities)
        }

        return agreements
    }

    suspend fun updateAgreement(dto: UserAgreementDto) = api.updateExpenseAgreement(dto)

    suspend fun cancelAgreement(dto: CancelAgreementDto) = api.cancelAgreement(dto.sharedExpenseId, dto)
}
