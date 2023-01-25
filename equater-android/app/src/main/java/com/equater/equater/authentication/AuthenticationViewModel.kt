package com.equater.equater.authentication

import android.content.SharedPreferences
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import arrow.core.continuations.nullable
import com.equater.equater.BuildConfig
import com.equater.equater.database.EquaterDatabase
import com.equater.equater.database.repository.UserAccountRepository
import com.equater.equater.database.repository.UserRepository
import com.equater.equater.database.repository.VendorRepository
import com.equater.equater.extensions.EquaterPreference
import com.equater.equater.extensions.toCurrency
import com.equater.equater.global.SignInEvent
import com.equater.equater.global.SignOutEvent
import com.equater.equater.logger
import com.equater.equater.socket.SocketClient
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.async
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.collectIndexed
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.greenrobot.eventbus.EventBus
import retrofit2.Response
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class AuthenticationViewModel @Inject constructor(
    private val preferences: SharedPreferences,
    private val userRepository: UserRepository,
    private val userAccountRepository: UserAccountRepository,
    private val vendorRepository: VendorRepository,
    private val socketClient: SocketClient,
    private val database: EquaterDatabase
) : ViewModel() {
    private val authToken = MutableStateFlow<String?>(null)

    // Observe the database for changes in the user that is authenticated
    val authenticatedUser: StateFlow<User?> = userRepository.observeAuthenticatedUser().stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(),
        null
    )

    // Whenever we have a newly authenticated user, observe changes to their accounts
    @OptIn(ExperimentalCoroutinesApi::class, kotlinx.serialization.ExperimentalSerializationApi::class)
    val authenticatedUserAccounts: StateFlow<List<UserAccount>> = authenticatedUser
        .distinctUntilChanged { old, new -> old?.equals(new) == true }
        .filterNotNull()
        .flatMapLatest { user ->
            val flow = userAccountRepository.observeAccountsForUser(user)
            val accounts = userAccountRepository.fetchAccountsFromApi()
            accountRequiringRelink.value = accounts?.find { it.getItemUpdateToken() != null }

            return@flatMapLatest flow
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(), arrayListOf())

    val signInState: StateFlow<SignInState> = authenticatedUser
        .distinctUntilChanged { old, new -> old?.equals(new) == true }
        .map {
            val token = authToken.value
            if (it != null && token != null) {
                SignedIn(it, token)
            } else {
                SignedOut
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(), SignedOut)

    val accountRequiringRelink = MutableStateFlow<UserAccount?>(null)

    private val balances = MutableStateFlow<List<Balance>>(listOf())

    val showOnBoardingIntroQuestion = MutableStateFlow(false)

    private val email = MutableStateFlow("")

    private val password = MutableStateFlow("")

    private val isLoading = MutableStateFlow(false)

    private val hasAcceptedTerms = MutableStateFlow(
        preferences.getBoolean(EquaterPreference.AcceptedTerms.preferenceName, false)
    )

    private val hasAcceptedPrivacyPolicy = MutableStateFlow(
        preferences.getBoolean(EquaterPreference.AcceptedPrivacyPolicy.preferenceName, false)
    )

    init {
        authToken.value = preferences.getString(EquaterPreference.AuthBearerToken.preferenceName, null)

        viewModelScope.launch {
            signInState.collectIndexed { index, state ->
                if (state is SignedIn) {
                    publishSignInEvent()
                } else if (index > 0) {
                    signOut()
                }
            }
        }
    }

    fun getIsLoading() = isLoading

    fun setEmail(value: String) {
        email.value = value
    }

    fun getEmail() = email

    suspend fun findAuthenticatedUser(): User? {
        return userRepository.findAuthenticatedUser()
    }

    // Primarily for dev + testers
    fun environmentHasChanged(): Boolean {
        val previousApiBase = preferences.getString(EquaterPreference.ApiBase.preferenceName, null)
        val currentApiBase = BuildConfig.API_BASE

        if (previousApiBase != currentApiBase) {
            preferences.edit().putString(EquaterPreference.ApiBase.preferenceName, currentApiBase).apply()

            return true
        }

        return false
    }

    fun setPassword(value: String) {
        password.value = value
    }

    fun getPassword() = password

    fun setIsLoading(value: Boolean) {
        isLoading.value = value
    }

    fun setHasAcceptedTerms(value: Boolean) {
        hasAcceptedTerms.value = value
        preferences.edit().putBoolean(EquaterPreference.AcceptedTerms.preferenceName, value).apply()
    }

    suspend fun updateAccountCache(account: UserAccount) {
        userAccountRepository.updateAccountCache(account)

        if (account.id == accountRequiringRelink.value?.id) {
            accountRequiringRelink.value = null
        }
    }

    fun hideOnBoardingScreen() {
        showOnBoardingIntroQuestion.value = false
        val user = authenticatedUser.value ?: return
        preferences.edit().putBoolean(EquaterPreference.HasSeenWalkThrough.keyedWithUser(user), true).apply()
    }

    fun shouldShowOnBoardingScreen(): Boolean {
        val user = authenticatedUser.value ?: return false
        val hasSeenOnBoarding = preferences.getBoolean(EquaterPreference.HasSeenWalkThrough.keyedWithUser(user), false)

        return user.onBoardingSelection == null && !hasSeenOnBoarding
    }

    fun sendOnBoardingFeedback(dto: OnBoardingFeedback) = viewModelScope.launch(Dispatchers.IO) {
        try {
            userRepository.patchOnBoardingFeedback(dto)
        } catch (e: Throwable) {
            Timber.e(e)
        }
    }

    fun persistLegalDocAcceptance() {
        viewModelScope.launch(Dispatchers.IO) {
            val response = userRepository.patchLegalDocAcceptance(
                LegalDocAcceptanceDto(
                    acceptedTermsOfService = true,
                    acceptedPrivacyPolicy = true
                )
            )

            // Naive approach since this is not ultra important to have in our records
            if (!response.isSuccessful) {
                delay(5000)
                persistLegalDocAcceptance()
            }
        }
    }

    fun setHasAcceptedPrivacyPolicy(value: Boolean) {
        hasAcceptedPrivacyPolicy.value = value
        preferences.edit().putBoolean(EquaterPreference.AcceptedPrivacyPolicy.preferenceName, value).apply()
    }

    fun getUserOnBoardingState(currentUser: User?): UserOnBoardingState {
        val user = currentUser ?: return UserOnBoardingState.ShouldRegister

        if (!user.profileIsComplete()) {
            return UserOnBoardingState.ShouldCreateProfile
        }

        if (!user.canReceiveFunds) {
            return UserOnBoardingState.ShouldVerifyIdentity
        }

        if (!user.acceptedTermsOfService) {
            return UserOnBoardingState.ShouldAgreeToTerms
        }

        if (!user.acceptedPrivacyPolicy) {
            return UserOnBoardingState.ShouldAgreeToPrivacyPolicy
        }

        return UserOnBoardingState.OnBoardingCompleted
    }

    fun signInAsync(f: (User?) -> Unit) = viewModelScope.launch(Dispatchers.IO) {
        try {
            val signInResponse = nullable {
                val request = SignInRequest(email.value.bind().trim(), password.value.bind())
                val response = userRepository.signIn(request).bind()

                val user = userRepository.handleSignIn(response)
                userAccountRepository.replaceUserAccountsCache(response.userAccounts)

                authToken.value = response.authToken
                preferences
                    .edit()
                    .putString(
                        EquaterPreference.AuthBearerToken.preferenceName,
                        response.authToken
                    )
                    .apply()

                publishSignInEvent()

                user
            }

            withContext(Dispatchers.Main) { f(signInResponse) }
        } catch (e: Throwable) {
            Timber.e(e)
            withContext(Dispatchers.Main) { f(null) }
        }
    }

    fun registerAsync(f: (Response<SignInResponse>?) -> Unit) = viewModelScope.launch(Dispatchers.IO) {
        try {
            val request = SignInRequest(email.value.trim(), password.value)
            val response = userRepository.register(request)

            nullable {
                val body = response.body().bind()
                userRepository.handleSignIn(body)
                userAccountRepository.replaceUserAccountsCache(body.userAccounts)

                authToken.value = body.authToken
                preferences.edit().putString(EquaterPreference.AuthBearerToken.preferenceName, body.authToken).apply()
            }

            withContext(Dispatchers.Main) { f(response) }
        } catch (e: Throwable) {
            Timber.e(e)
            withContext(Dispatchers.Main) { f(null) }
        }
    }

    fun signOut() {
        authToken.value = null
        viewModelScope.launch(Dispatchers.Default) {
            userRepository.handleSignOut()
            delay(500)
            try {
                database.clearAllTables()
            } catch (e: Throwable) {
                Timber.e(e)
            }
        }
        setEmail("")
        setPassword("")
        setIsLoading(false)
        EventBus.getDefault().post(SignOutEvent)
        socketClient.stopListening()
        logger?.removeAttribute("userId")
        logger?.removeAttribute("environment")
        logger?.removeAttribute("plaidEnvironment")
    }

    fun permanentlyDeleteAccount(user: User) {
        viewModelScope.launch(Dispatchers.Default) {
            userRepository.permanentlyDeleteAccount(user.id)
            signOut()
        }
    }

    fun resetPassword() {
        viewModelScope.launch {
            email.value.let { email ->
                val response = userRepository.requestPasswordReset(ResetPasswordDto(email.trim()))
                Timber.d("Response ${response.code()}")
            }
        }
    }

    fun resendEmailConfirmationAsync() = viewModelScope.async(Dispatchers.IO) {
        val user = authenticatedUser.value ?: throw IllegalStateException(
            "Cannot resend email confirmation without authenticated user"
        )

        return@async userRepository.resendEmailVerification(user.email)
    }

    // If we fail to fetch the balance we don't treat it as a big deal for now. We'll just display it as $0.00
    // since 99.9% of users will not have a balance. Dwolla requires us to show one in order to approve the app.
    private fun updateBalanceCache() {
        viewModelScope.launch {
            val response = userRepository.getBalance()
            response.body()?.let {
                balances.value = it
            }
        }
    }

    // / Equater can keep multiple cards on file, which means multiple potential balances.
    // / Derive a total balance by summing all other balances
    // / It's the responsibility of the server to handle reconciliation of each individual
    // / balance if it exists
    fun getTotalBalanceFormatted(): String {
        if (balances.value.isEmpty()) {
            return "$0.00"
        }

        val total = balances.value.sumOf { it.dineroValueRepresentation }

        return total.toCurrency()
    }

    fun syncUserState() {
        viewModelScope.launch {
            userRepository.findUserAndRefresh().collectIndexed { index, _ ->
                if (index == 0) {
                    syncUserAccountState()
                }
            }
        }
    }

    fun syncRelationships(userId: Int) {
        viewModelScope.launch {
            try {
                userRepository.getRelationships(userId)
            } catch (e: Throwable) {
                Timber.e(e)
            }
        }
    }

    fun handleNotificationPermissionGranted() = viewModelScope.launch {
        userRepository.registerDeviceToken()
    }

    private suspend fun syncUserAccountState() {
        userAccountRepository.fetchAccountsFromApi()
    }

    private fun publishSignInEvent() {
        val signInResponse = nullable.eager {
            SignInResponse(
                authToken = authToken.value.bind(),
                user = authenticatedUser.value.bind(),
                userAccounts = authenticatedUserAccounts.value.bind()
            )
        }

        signInResponse?.let { response ->
            logger?.addAttribute("userId", response.user.id)

            viewModelScope.launch {
                launch { userRepository.preCacheUserPhotos(response.user) }
                launch { vendorRepository.populateVendorCache() }
                launch { userRepository.getRelationships(response.user.id) }
                launch { userRepository.registerDeviceToken() }
                updateBalanceCache()
                authToken.value?.let { token -> socketClient.listenForEvents(token) }

                // Runs on a slight delay if the sign in happened on launch so that the rest of the DI system can be initialized
                delay(100)
                EventBus.getDefault().post(SignInEvent(response))
            }
        }
    }
}
