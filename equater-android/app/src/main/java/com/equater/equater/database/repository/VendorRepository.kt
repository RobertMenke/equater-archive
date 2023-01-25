package com.equater.equater.database.repository

import android.content.Context
import com.equater.equater.database.dao.VendorDao
import com.equater.equater.profile.VendorLogo
import com.equater.equater.searchVendors.GooglePlacesPredictionItem
import com.equater.equater.searchVendors.Vendor
import com.equater.equater.searchVendors.VendorSearchApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.distinctUntilChanged
import retrofit2.HttpException
import timber.log.Timber
import javax.inject.Inject

class VendorRepository @Inject constructor(
    private val context: Context,
    private val dao: VendorDao,
    private val api: VendorSearchApi
) {
    // ///////////////////////////////
    // Database
    // ///////////////////////////////

    /**
     * Rely on populating the vendor cache on sign-in and then use the
     * cache to observe popular vendors
     */
    fun getPopularVendors(): Flow<List<Vendor>> {
        return dao.observeVendors().distinctUntilChanged { old, new -> old.size == new.size }
    }

    suspend fun populateVendorCache() {
        try {
            fetchPopularVendors()
        } catch (e: Throwable) {
            Timber.e(e)
        }
    }

    // ///////////////////////////////
    // HTTP API
    // ///////////////////////////////
    suspend fun searchVendors(query: String): List<Vendor> {
        val response = api.searchVendors(query)

        if (!response.isSuccessful) {
            Timber.e(response.errorBody()?.string())
            throw HttpException(response)
        }

        return response.body()?.vendors ?: return listOf()
    }

    suspend fun createVendorFromGooglePlace(place: GooglePlacesPredictionItem) = api.createVendor(place)

    private suspend fun fetchPopularVendors(): List<Vendor> {
        val remoteVendors = api.fetchPopularVendors().body()?.vendors ?: return listOf()

        dao.upsert(remoteVendors)

        remoteVendors.forEach {
            VendorLogo(context, it).cache()
        }

        return remoteVendors
    }
}
