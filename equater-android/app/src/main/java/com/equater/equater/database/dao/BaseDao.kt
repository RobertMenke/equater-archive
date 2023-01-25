package com.equater.equater.database.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Transaction
import androidx.room.Update

@Dao
abstract class BaseDao<T> {
    /**
     * Insert an object in the database.
     *
     * @param entity the object to be inserted.
     * @return The SQLite row id
     */
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    abstract fun insert(entity: T): Long

    /**
     * Insert an array of objects in the database.
     *
     * @param entities the objects to be inserted.
     * @return The SQLite row ids
     */
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    abstract fun insert(entities: List<T>): List<Long>

    /**
     * Update an object from the database.
     *
     * @param entity the object to be updated
     */
    @Update
    abstract suspend fun update(entity: T)

    /**
     * Update an array of objects from the database.
     *
     * @param entity the object to be updated
     */
    @Update
    abstract suspend fun update(entity: List<T>)

    /**
     * Delete an object from the database
     *
     * @param entity the object to be deleted
     */
    @Delete
    abstract suspend fun delete(entity: T)

    @Transaction
    open suspend fun upsert(entity: T) {
        val id = insert(entity)
        if (id == -1L) {
            update(entity)
        }
    }

    @Transaction
    open suspend fun upsert(entities: List<T>) {
        val insertResult = insert(entities)
        val updateList: MutableList<T> = ArrayList()

        for (i in insertResult.indices) {
            if (insertResult[i] == -1L) {
                updateList.add(entities[i])
            }
        }

        if (updateList.isNotEmpty()) {
            update(updateList)
        }
    }
}
