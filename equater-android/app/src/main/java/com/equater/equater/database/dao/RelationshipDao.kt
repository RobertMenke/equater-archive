package com.equater.equater.database.dao

import androidx.room.Dao
import androidx.room.Query
import com.equater.equater.authentication.Relationship
import kotlinx.coroutines.flow.Flow

@Dao
abstract class RelationshipDao : BaseDao<Relationship>() {
    @Query("SELECT * FROM relationship where relatedToUserId = :forUserId")
    abstract suspend fun getAll(forUserId: Int): List<Relationship>

    @Query("SELECT * FROM relationship where relatedToUserId = :forUserId")
    abstract fun observeRelationships(forUserId: Int): Flow<List<Relationship>>
}
