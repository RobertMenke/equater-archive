package com.equater.equater.database.repository

import android.content.Context
import android.content.SharedPreferences
import com.equater.equater.authentication.AuthenticationApi
import com.equater.equater.authentication.DeviceRegistrationDto
import com.equater.equater.authentication.EmailDto
import com.equater.equater.authentication.LegalDocAcceptanceDto
import com.equater.equater.authentication.OnBoardingFeedback
import com.equater.equater.authentication.Relationship
import com.equater.equater.authentication.ResetPasswordDto
import com.equater.equater.authentication.SignInRequest
import com.equater.equater.authentication.SignInResponse
import com.equater.equater.authentication.User
import com.equater.equater.database.dao.RelationshipDao
import com.equater.equater.database.dao.UserDao
import com.equater.equater.extensions.EquaterPreference
import com.equater.equater.extensions.putJson
import com.equater.equater.identityVerification.PatchAddressDto
import com.equater.equater.identityVerification.RecipientOfFundsFormDto
import com.equater.equater.profile.Avatar
import com.equater.equater.profile.CoverPhoto
import com.equater.equater.profile.PhotoType
import com.equater.equater.profile.PhotoUploadStatusDto
import com.equater.equater.profile.ProfileDto
import com.equater.equater.profile.UserApi
import com.equater.equater.searchUsers.UserSearchResponse
import com.google.android.gms.tasks.OnCompleteListener
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.launch
import kotlinx.serialization.ExperimentalSerializationApi
import okhttp3.RequestBody
import retrofit2.HttpException
import retrofit2.Response
import timber.log.Timber
import javax.inject.Inject

class UserRepository @Inject constructor(
    private val context: Context,
    private val dao: UserDao,
    private val api: AuthenticationApi,
    private val userApi: UserApi,
    private val relationshipDao: RelationshipDao,
    private val preferences: SharedPreferences
) {
    private val ioScope = CoroutineScope(Job() + Dispatchers.IO)

    suspend fun findUserAndRefresh(): Flow<User> {
        return flow {
            val localUser = dao.findAuthenticatedUser()
            if (localUser != null) {
                emit(localUser)
            }
            val remoteUser = fetchUserFromApi()
            if (remoteUser != null) {
                emit(remoteUser)
            }
        }
    }

    suspend fun handleSignIn(response: SignInResponse): User {
        val user = response.user
        val authToken = response.authToken

        dao.signOut()
        preferences.putJson(EquaterPreference.User.preferenceName, user)
        preferences.edit().putString(EquaterPreference.AuthBearerToken.preferenceName, authToken).apply()

        insertOrUpdateUser(user)

        getFirebaseToken { token ->
            ioScope.launch {
                userApi.registerDevice(DeviceRegistrationDto.fromToken(token))
            }
        }

        return user
    }

    suspend fun registerDeviceToken() {
        getFirebaseToken { token ->
            ioScope.launch {
                userApi.registerDevice(DeviceRegistrationDto.fromToken(token))
            }
        }
    }

    suspend fun registerDeviceIfSignedIn(token: String) {
        // If we have an auth token handy we can add a registration token
        if (preferences.getString(EquaterPreference.AuthBearerToken.preferenceName, "")?.isNotEmpty() == true) {
            userApi.registerDevice(DeviceRegistrationDto.fromToken(token))
        }
    }

    suspend fun handleSignOut() {
        dao.signOut()

        preferences
            .edit()
            .remove(EquaterPreference.User.preferenceName)
            .remove(EquaterPreference.AuthBearerToken.preferenceName)
            .apply()
    }

    private fun getFirebaseToken(completion: (String) -> Unit) {
        FirebaseMessaging.getInstance().token.addOnCompleteListener(
            OnCompleteListener { task ->
                if (!task.isSuccessful) {
                    Timber.w("Could not fetch firebase token")
                    return@OnCompleteListener
                }

                val token = task.result
                completion(token)
            }
        )
    }

    @OptIn(ExperimentalSerializationApi::class)
    suspend fun preCacheUserPhotos(user: User) {
        ioScope.launch {
            val avatar = Avatar(context, user)
            if (avatar.remoteUrlIsExpired()) {
                getPreSignedDownloadUrl(PhotoType.AVATAR).body()?.preSignedUrl?.let { url ->
                    val updatedUser = user.copy(preSignedPhotoDownloadUrl = url)
                    insertOrUpdateUser(updatedUser)
                    Avatar(context, updatedUser).cache()
                }
            } else {
                avatar.cache()
            }

            val coverPhoto = CoverPhoto(context, user)
            if (coverPhoto.remoteUrlIsExpired()) {
                getPreSignedDownloadUrl(PhotoType.COVER_PHOTO).body()?.preSignedUrl?.let { url ->
                    val updatedUser = user.copy(preSignedCoverPhotoDownloadUrl = url)
                    insertOrUpdateUser(updatedUser)
                    CoverPhoto(context, updatedUser).cache()
                }
            } else {
                coverPhoto.cache()
            }
        }
    }

    // ///////////////////////////////
    // Database
    // ///////////////////////////////

    @OptIn(ExperimentalSerializationApi::class)
    suspend fun insertOrUpdateUser(user: User, isAuthenticated: Boolean = true): User {
        val updatedUser = user.copy(isAuthenticatedUser = isAuthenticated)
        dao.upsert(updatedUser)

        return updatedUser
    }

    fun observeAuthenticatedUser(): Flow<User?> = dao.observeAuthenticatedUser()

    fun observeRelationships(forUserId: Int) = relationshipDao.observeRelationships(forUserId)

    suspend fun findAuthenticatedUser(): User? {
        return dao.findAuthenticatedUser()
    }

    // ///////////////////////////////
    // HTTP API
    // ///////////////////////////////
    suspend fun signIn(request: SignInRequest): SignInResponse? {
        return api.signIn(request).body()
    }

    suspend fun register(request: SignInRequest): Response<SignInResponse> {
        return api.register(request)
    }

    suspend fun requestPasswordReset(dto: ResetPasswordDto): Response<Unit> {
        return api.requestPasswordReset(dto)
    }

    private suspend fun fetchUserFromApi(): User? {
        val userResponse = api.fetchUser()
        val user = userResponse.body()
        user?.let {
            insertOrUpdateUser(it)
        }

        return user
    }

    suspend fun getRelationships(forUserId: Int): List<Relationship> {
        val response = userApi.getRelationships(forUserId)
        val users = response.body()

        if (users == null) {
            Timber.d(response.errorBody()?.string())
            return listOf()
        }

        val relationships = users.map {
            Avatar(context, it).cache()
            return@map Relationship.fromUser(it, forUserId)
        }

        relationshipDao.upsert(relationships)

        return relationships
    }

    suspend fun searchUsers(query: String): UserSearchResponse {
        val response = userApi.searchUsers(query)
        val body = response.body()

        if (body == null) {
            Timber.e(response.errorBody()?.string())
            throw HttpException(response)
        }

        return body
    }

    suspend fun patchName(dto: ProfileDto): Response<User> {
        val userResponse = userApi.patchName(dto)
        val user = userResponse.body()
        user?.let {
            insertOrUpdateUser(it)
        }

        return userResponse
    }
    suspend fun getPreSignedUploadUrl(type: PhotoType) = userApi.getPreSignedUploadUrl(type)
    private suspend fun getPreSignedDownloadUrl(type: PhotoType) = userApi.getPreSignedDownloadUrl(type)

    suspend fun setPhotoUploadStatus(dto: PhotoUploadStatusDto): User? {
        val userResponse = userApi.setPhotoUploadStatus(dto)
        val user = userResponse.body()
        user?.let {
            insertOrUpdateUser(it)
            preCacheUserPhotos(it)
        }

        return user
    }

    suspend fun patchIdentityVerification(dto: RecipientOfFundsFormDto): Response<User> {
        val userResponse = userApi.patchIdentityVerification(dto)
        val user = userResponse.body()

        user?.let {
            insertOrUpdateUser(it)
        }

        return userResponse
    }

    suspend fun patchAddress(dto: PatchAddressDto): Response<User> {
        val userResponse = userApi.patchAddress(dto)
        val user = userResponse.body()

        user?.let {
            insertOrUpdateUser(it)
        }

        return userResponse
    }

    suspend fun patchOnBoardingFeedback(dto: OnBoardingFeedback): Response<User> {
        val userResponse = userApi.patchOnBoardingFeedback(dto)
        val user = userResponse.body()

        user?.let {
            insertOrUpdateUser(it)
        }

        return userResponse
    }

    suspend fun patchLegalDocAcceptance(dto: LegalDocAcceptanceDto): Response<User> {
        val userResponse = userApi.patchLegalDocAcceptance(dto)
        val user = userResponse.body()

        user?.let {
            insertOrUpdateUser(it)
        }

        return userResponse
    }

    suspend fun uploadFile(contentType: String, uploadUrl: String, file: RequestBody) = userApi.uploadFile(
        contentType,
        uploadUrl,
        file
    )

    suspend fun resendEmailVerification(email: String): Response<Unit> {
        return api.resendEmailConfirmation(EmailDto(email))
    }

    suspend fun getBalance() = userApi.getBalances()

    suspend fun permanentlyDeleteAccount(userId: Int) {
        userApi.permanentlyDeleteAccount(userId)
    }
}
