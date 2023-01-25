package com.equater.equater.global

import com.equater.equater.authentication.AuthenticationApi
import com.equater.equater.linkBankAccount.UserAccountApi
import com.equater.equater.profile.UserApi
import com.equater.equater.searchVendors.VendorSearchApi
import com.equater.equater.sharedExpenseCreation.SharedExpenseApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
class HttpModule {
    @Provides
    @Singleton
    fun provideAuthenticationRestService(retrofit: Retrofit): AuthenticationApi = retrofit.create(
        AuthenticationApi::class.java
    )

    @Provides
    @Singleton
    fun createProfileApi(retrofit: Retrofit) = retrofit.create(UserApi::class.java)

    @Provides
    @Singleton
    fun createPlaidRestService(retrofit: Retrofit) = retrofit.create(UserAccountApi::class.java)

    @Provides
    @Singleton
    fun createVendorSearchApi(retrofit: Retrofit) = retrofit.create(VendorSearchApi::class.java)

    @Provides
    @Singleton
    fun createSharedExpenseApi(retrofit: Retrofit) = retrofit.create(SharedExpenseApi::class.java)
}
