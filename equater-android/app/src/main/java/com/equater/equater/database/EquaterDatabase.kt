package com.equater.equater.database

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.equater.equater.authentication.Relationship
import com.equater.equater.authentication.User
import com.equater.equater.authentication.UserAccount
import com.equater.equater.database.dao.AgreementDao
import com.equater.equater.database.dao.RelationshipDao
import com.equater.equater.database.dao.TransactionDao
import com.equater.equater.database.dao.UserAccountDao
import com.equater.equater.database.dao.UserDao
import com.equater.equater.database.dao.VendorDao
import com.equater.equater.manageAgreements.SharedExpenseEntity
import com.equater.equater.searchVendors.Vendor
import com.equater.equater.transaction.TransactionEntity

@Database(
    entities = [
        User::class,
        UserAccount::class,
        SharedExpenseEntity::class,
        TransactionEntity::class,
        Vendor::class,
        Relationship::class
    ],
    version = 14
)
@TypeConverters(Converters::class)
abstract class EquaterDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun userAccountDao(): UserAccountDao
    abstract fun agreementDao(): AgreementDao
    abstract fun transactionDao(): TransactionDao
    abstract fun vendorDao(): VendorDao
    abstract fun relationshipDao(): RelationshipDao
}
