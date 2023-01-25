package com.equater.equater.database.dao

import androidx.room.Dao
import androidx.room.Query
import com.equater.equater.authentication.User
import kotlinx.coroutines.flow.Flow

@Dao
abstract class UserDao : BaseDao<User>() {
    @Query("SELECT * FROM user where id = :id")
    abstract suspend fun findUser(id: Int): User?

    @Query("SELECT * FROM user where isAuthenticatedUser = 1")
    abstract fun observeAuthenticatedUser(): Flow<User?>

    @Query("SELECT * FROM user where isAuthenticatedUser = 1")
    abstract suspend fun findAuthenticatedUser(): User?

    @Query("UPDATE user set isAuthenticatedUser = 0 where isAuthenticatedUser = 1")
    abstract suspend fun signOut()
}
