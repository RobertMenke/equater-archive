package com.equater.equater.database

import com.equater.equater.database.dao.AgreementDao
import com.equater.equater.database.dao.RelationshipDao
import com.equater.equater.database.dao.TransactionDao
import com.equater.equater.database.dao.UserAccountDao
import com.equater.equater.database.dao.UserDao
import com.equater.equater.database.dao.VendorDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
class DatabaseRepositoryModule {
    @Provides
    @Singleton
    fun userDao(database: EquaterDatabase): UserDao {
        return database.userDao()
    }

    @Provides
    @Singleton
    fun userAccountDao(database: EquaterDatabase): UserAccountDao {
        return database.userAccountDao()
    }

    @Provides
    @Singleton
    fun agreementDao(database: EquaterDatabase): AgreementDao {
        return database.agreementDao()
    }

    @Provides
    @Singleton
    fun transactionDao(database: EquaterDatabase): TransactionDao {
        return database.transactionDao()
    }

    @Provides
    @Singleton
    fun vendorDao(database: EquaterDatabase): VendorDao {
        return database.vendorDao()
    }

    @Provides
    @Singleton
    fun relationshipDao(database: EquaterDatabase): RelationshipDao {
        return database.relationshipDao()
    }
}
