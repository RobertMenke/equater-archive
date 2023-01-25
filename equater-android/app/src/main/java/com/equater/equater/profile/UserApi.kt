package com.equater.equater.profile

import com.equater.equater.authentication.Balance
import com.equater.equater.authentication.DeviceRegistrationDto
import com.equater.equater.authentication.LegalDocAcceptanceDto
import com.equater.equater.authentication.OnBoardingFeedback
import com.equater.equater.authentication.User
import com.equater.equater.identityVerification.PatchAddressDto
import com.equater.equater.identityVerification.RecipientOfFundsFormDto
import com.equater.equater.searchUsers.UserSearchResponse
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.Url

interface UserApi {
    @PATCH("/api/user/name")
    suspend fun patchName(@Body dto: ProfileDto): Response<User>

    @GET("/api/user/pre-signed-photo-upload-url")
    suspend fun getPreSignedUploadUrl(@Query("photoType") type: PhotoType): Response<PreSignedUrlResponse>

    @GET("/api/user/pre-signed-photo-download-url")
    suspend fun getPreSignedDownloadUrl(@Query("photoType") dto: PhotoType): Response<PreSignedUrlResponse>

    @GET("/api/user/{id}/relationships")
    suspend fun getRelationships(@Path("id") id: Int): Response<List<User>>

    @GET("/api/user/search")
    suspend fun searchUsers(@Query("searchTerm") query: String): Response<UserSearchResponse>

    @GET("/api/user/balance")
    suspend fun getBalances(): Response<List<Balance>>

    @PATCH("/api/user/photo-upload-status")
    suspend fun setPhotoUploadStatus(@Body dto: PhotoUploadStatusDto): Response<User>

    @PUT("/api/user/register-device")
    suspend fun registerDevice(@Body dto: DeviceRegistrationDto): Response<Unit>

    @PATCH("/api/user/recipient-of-funds")
    suspend fun patchIdentityVerification(@Body dto: RecipientOfFundsFormDto): Response<User>

    @PATCH("/api/user/address")
    suspend fun patchAddress(@Body dto: PatchAddressDto): Response<User>

    @PATCH("/api/user/legal-doc-acceptance")
    suspend fun patchLegalDocAcceptance(@Body dto: LegalDocAcceptanceDto): Response<User>

    @PATCH("/api/user/on-boarding-feedback")
    suspend fun patchOnBoardingFeedback(@Body dto: OnBoardingFeedback): Response<User>

    @DELETE("/api/user/{id}")
    suspend fun permanentlyDeleteAccount(@Path("id") id: Int): Response<Unit>

    // See this article as an example https://gutier.io/post/android-upload-file-to-aws-s3-bucket-with-retrofit2/
    @PUT
    suspend fun uploadFile(
        @Header("Content-Type") contentType: String,
        @Url uploadUrl: String,
        @Body file: RequestBody
    ): Response<Unit>
}
