package com.equater.equater.database.dao

import androidx.room.Dao
import androidx.room.Query
import com.equater.equater.manageAgreements.SharedExpenseEntity
import kotlinx.coroutines.flow.Flow

@Dao
abstract class AgreementDao : BaseDao<SharedExpenseEntity>() {
    @Query("SELECT * FROM agreement where authenticatedUserId = :authenticatedUserId order by dateTime desc")
    abstract fun observeAgreementsForUser(authenticatedUserId: Int): Flow<List<SharedExpenseEntity>>

    @Query("SELECT * FROM agreement where id = :id")
    abstract suspend fun findAgreement(id: Int): SharedExpenseEntity?

    @Query("DELETE FROM agreement where authenticatedUserId = :userId")
    abstract suspend fun deleteForUser(userId: Int)
}
