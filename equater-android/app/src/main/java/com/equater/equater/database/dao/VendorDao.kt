package com.equater.equater.database.dao

import androidx.room.Dao
import androidx.room.Query
import com.equater.equater.searchVendors.Vendor
import kotlinx.coroutines.flow.Flow

// Note: This only keeps a cache of what we consider "popular vendors"
// which will typically be ~50 vendors that have a lot of shared bills
@Dao
abstract class VendorDao : BaseDao<Vendor>() {
    @Query("SELECT * FROM vendor where id = :id")
    abstract suspend fun findVendor(id: Int): Vendor?

    @Query("SELECT * FROM vendor order by totalNumberOfExpenseSharingAgreements desc")
    abstract fun observeVendors(): Flow<List<Vendor>>
}
