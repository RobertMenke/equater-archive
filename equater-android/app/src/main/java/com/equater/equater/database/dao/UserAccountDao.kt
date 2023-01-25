package com.equater.equater.database.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.equater.equater.authentication.UserAccount
import kotlinx.coroutines.flow.Flow

@Dao
abstract class UserAccountDao : BaseDao<UserAccount>() {
    @Query("SELECT * FROM user_account where id = :id")
    abstract suspend fun findAccount(id: Int): UserAccount

    @Query("SELECT * FROM user_account where userId = :userId")
    abstract suspend fun findAccountsForUser(userId: Int): List<UserAccount>

    @Query("SELECT * FROM user_account where userId = :userId")
    abstract fun observeAccountsForUser(userId: Int): Flow<List<UserAccount>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    abstract suspend fun insertAll(vararg accounts: UserAccount)

    @Delete
    abstract suspend fun deleteAll(vararg accounts: UserAccount)

    @Query("DELETE FROM user_account where userId = :userId")
    abstract suspend fun deleteForUser(userId: Int)
}
