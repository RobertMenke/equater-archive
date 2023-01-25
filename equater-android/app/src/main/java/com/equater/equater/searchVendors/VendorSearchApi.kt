package com.equater.equater.searchVendors

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PUT
import retrofit2.http.Query

interface VendorSearchApi {
    @GET("/api/vendor/search")
    suspend fun searchVendors(@Query("searchTerm") searchTerm: String): Response<VendorSearchResponse>

    @GET("/api/vendor/popular")
    suspend fun fetchPopularVendors(@Query("limit") limit: Int = 50): Response<VendorSearchResponse>

    @PUT("/api/vendor/from-google-places")
    suspend fun createVendor(@Body dto: GooglePlacesPredictionItem): Response<Vendor>
}
