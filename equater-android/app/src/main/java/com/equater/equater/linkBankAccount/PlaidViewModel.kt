package com.equater.equater.linkBankAccount

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import arrow.core.computations.nullable
import com.equater.equater.BuildConfig
import com.equater.equater.authentication.PlaidTokenType
import com.equater.equater.authentication.User
import com.equater.equater.authentication.UserAccount
import com.equater.equater.authentication.matches
import com.equater.equater.database.repository.UserAccountRepository
import com.equater.equater.database.repository.UserRepository
import com.equater.equater.global.EnvironmentService
import com.fasterxml.jackson.databind.ObjectMapper
import com.plaid.link.configuration.LinkLogLevel
import com.plaid.link.configuration.LinkTokenConfiguration
import com.plaid.link.linkTokenConfiguration
import com.plaid.link.result.LinkSuccess
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.ExperimentalSerializationApi
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class PlaidViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val userAccountRepository: UserAccountRepository,
    private val mapper: ObjectMapper
) : ViewModel() {

    val isLoading = MutableStateFlow(false)

    fun handleLinkSuccess(
        response: LinkSuccess,
        user: User,
        onComplete: suspend (account: UserAccount?, e: Throwable?) -> Unit
    ) {
        try {
            Timber.d(response.metadata.metadataJson)
            isLoading.value = true
            viewModelScope.launch(Dispatchers.IO) {
                when (val action = getAccountActionAsync(response, user).await()) {
                    is NewPlaidAccount -> handleNewAccount(action, onComplete)
                    is UpdatedPlaidAccount -> handleAccountUpdate(action, onComplete)
                    is LinkAccountError -> withContext(Dispatchers.Main) {
                        isLoading.value = false
                        onComplete(null, action.error)
                    }
                }
            }
        } catch (e: Throwable) {
            Timber.e(e)
            viewModelScope.launch {
                onComplete(null, e)
            }
            isLoading.value = false
        }
    }

    private suspend fun handleNewAccount(
        action: NewPlaidAccount,
        onComplete: suspend (account: UserAccount?, e: Throwable?) -> Unit
    ) {
        val apiResponse = userAccountRepository.linkBankAccount(action.dto)
        if (apiResponse.code() == 200) {
            apiResponse.body()?.let { body ->
                userRepository.insertOrUpdateUser(body.user)
                userAccountRepository.replaceUserAccountsCache(body.userAccounts)
                withContext(Dispatchers.Main) {
                    val account = body.userAccounts.find { it.matches(action.dto) }
                    isLoading.value = false
                    onComplete(account, null)
                }
            }
        } else {
            sendGenericError(onComplete)
        }
    }

    suspend fun unlinkBankAccount(account: UserAccount, onComplete: (didSucceed: Boolean) -> Unit) {
        val responseStatus = userAccountRepository.unlinkBankAccount(account)

        onComplete(responseStatus == 200)
    }

    private suspend fun handleAccountUpdate(
        action: UpdatedPlaidAccount,
        onComplete: suspend (account: UserAccount?, e: Throwable?) -> Unit
    ) {
        val apiResponse = userAccountRepository.updateBankAccount(action.account.id)
        if (apiResponse.code() == 200) {
            apiResponse.body()?.let { userAccount ->
                userAccountRepository.updateAccountCache(userAccount)
                withContext(Dispatchers.Main) {
                    isLoading.value = false
                    onComplete(userAccount, null)
                }
            }
        } else {
            sendGenericError(onComplete)
        }
    }

    fun handleAccountUpdate(account: UserAccount, onComplete: suspend (account: UserAccount?, e: Throwable?) -> Unit) {
        viewModelScope.launch {
            val apiResponse = userAccountRepository.updateBankAccount(account.id)
            if (apiResponse.code() == 200) {
                apiResponse.body()?.let { userAccount ->
                    withContext(Dispatchers.Main) {
                        userAccountRepository.updateAccountCache(userAccount)
                        isLoading.value = false
                        onComplete(userAccount, null)
                    }
                }
            } else {
                sendGenericError(onComplete)
            }
        }
    }

    private suspend fun sendGenericError(onComplete: suspend (account: UserAccount?, e: Throwable?) -> Unit) {
        withContext(Dispatchers.Main) {
            isLoading.value = false
            onComplete(null, Throwable("Error linking account. Contact ${EnvironmentService.getSupportPhoneNumber()}"))
        }
    }

    private fun getAccountActionAsync(
        response: LinkSuccess,
        user: User
    ): Deferred<LinkAccountAction> = viewModelScope.async(Dispatchers.Default) {
        try {
            val dto = PlaidLinkResponse(
                token = response.publicToken,
                metaData = PlaidMetaData.fromJson(mapper, response.metadata.metadataJson)
            )

            val accountAction = nullable {
                val accountToUpdate = userAccountRepository.findAccountThatRequiresReAuthentication(user).bind()
                UpdatedPlaidAccount(accountToUpdate)
            }

            accountAction ?: NewPlaidAccount(dto)
        } catch (e: Throwable) {
            Timber.e(e)
            LinkAccountError(e)
        }
    }

    @OptIn(ExperimentalSerializationApi::class)
    suspend fun createTokenConfiguration(user: User, type: PlaidTokenType): LinkTokenConfiguration? {
        return nullable {
            val plaidToken = getLinkToken(user, type).bind()

            linkTokenConfiguration {
                token = plaidToken
                logLevel = if (BuildConfig.DEBUG) LinkLogLevel.VERBOSE else LinkLogLevel.ERROR
            }
        }
    }

    fun createTokenConfiguration(plaidToken: String): LinkTokenConfiguration {
        return linkTokenConfiguration {
            token = plaidToken
            logLevel = if (BuildConfig.DEBUG) LinkLogLevel.VERBOSE else LinkLogLevel.ERROR
        }
    }

    @OptIn(ExperimentalSerializationApi::class)
    private suspend fun getLinkToken(user: User, type: PlaidTokenType) = when (type) {
        PlaidTokenType.AndroidItemUpdate -> {
            userAccountRepository.findAccountThatRequiresReAuthentication(user)?.plaidLinkToken
        }
        PlaidTokenType.AndroidCreditAndDepository -> {
            user.getCreditAndDepositoryToken()
        }
        else -> {
            user.getDepositoryToken()
        }
    }
}
