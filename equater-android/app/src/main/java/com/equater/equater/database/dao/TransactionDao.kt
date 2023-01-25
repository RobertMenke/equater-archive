package com.equater.equater.database.dao

import androidx.room.Dao
import androidx.room.Query
import com.equater.equater.transaction.TransactionEntity
import kotlinx.coroutines.flow.Flow

@Dao
abstract class TransactionDao : BaseDao<TransactionEntity>() {
    @Query(
        "SELECT * FROM agreement_transaction where authenticatedUserId = :authenticatedUserId order by dateTime desc"
    )
    abstract fun observeTransactionsForUser(authenticatedUserId: Int): Flow<List<TransactionEntity>>

    @Query("DELETE FROM agreement_transaction where authenticatedUserId = :userId")
    abstract suspend fun deleteForUser(userId: Int)
}
