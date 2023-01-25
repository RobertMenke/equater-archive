package com.equater.equater.database.repository

import com.equater.equater.database.dao.TransactionDao
import com.equater.equater.sharedExpenseCreation.SharedExpenseApi
import com.equater.equater.sharedExpenseCreation.TransactionStory
import com.equater.equater.sharedExpenseCreation.toEntity
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.mapLatest
import javax.inject.Inject

class TransactionRepository @Inject constructor(
    private val api: SharedExpenseApi,
    private val dao: TransactionDao
) {
    // ///////////////////////////////
    // Database
    // ///////////////////////////////
    @OptIn(ExperimentalCoroutinesApi::class)
    fun observeTransactions(userId: Int): Flow<List<TransactionStory>> {
        return dao.observeTransactionsForUser(userId)
            .distinctUntilChanged()
            .mapLatest { transactions -> transactions.map { it.story } }
    }

    suspend fun insertTransaction(userId: Int, transactionStory: TransactionStory) {
        val entity = transactionStory.toEntity(userId)

        dao.upsert(entity)
    }

    // ///////////////////////////////
    // HTTP API
    // ///////////////////////////////
    suspend fun fetchTransactions(userId: Int): List<TransactionStory> {
        val response = api.fetchTransactions(userId)
        val transactions = response.body() ?: return listOf()

        val entities = transactions.map { it.toEntity(userId) }

        if (entities.isNotEmpty()) {
            dao.upsert(entities)
        }

        return transactions
    }
}
