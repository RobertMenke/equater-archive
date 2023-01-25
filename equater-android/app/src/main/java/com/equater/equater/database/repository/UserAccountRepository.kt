package com.equater.equater.database.repository

import android.app.Application
import android.content.Context
import arrow.core.computations.nullable
import com.equater.equater.authentication.User
import com.equater.equater.authentication.UserAccount
import com.equater.equater.database.dao.UserAccountDao
import com.equater.equater.linkBankAccount.PatchBankAccountResponse
import com.equater.equater.linkBankAccount.PlaidLinkResponse
import com.equater.equater.linkBankAccount.UserAccountApi
import com.equater.equater.profile.PlaidInstitution
import com.plaid.link.Plaid
import com.plaid.link.PlaidHandler
import com.plaid.link.configuration.LinkTokenConfiguration
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.flow
import retrofit2.Response
import timber.log.Timber
import javax.inject.Inject

class UserAccountRepository @Inject constructor(
    @ApplicationContext
    private val context: Context,
    private val dao: UserAccountDao,
    private val api: UserAccountApi,
    private val userRepository: UserRepository
) {
    suspend fun findUserAccountsAndRefresh(user: User): Flow<List<UserAccount>> {
        return flow {
            nullable {
                try {
                    Timber.d("xxx finding local accounts")
                    val localAccounts = findAccountsForUser(user)
                    Timber.d("xxx emitting local accounts")
                    emit(localAccounts)
                    Timber.d("xxx finding remote accounts")
                    val remoteAccounts = fetchAccountsFromApi().bind()
                    Timber.d("xxx emitting remote accounts")
                    emit(remoteAccounts)
                    Timber.d("xxx finished emitting remote accounts")
                } catch (e: Throwable) {
                    Timber.e(e, "xxx")
                }
            }
        }
    }

    fun createPlaidHandler(tokenConfig: LinkTokenConfiguration): PlaidHandler {
        val application = context as Application

        return Plaid.create(application, tokenConfig)
    }

    // ///////////////////////////////
    // Database
    // ///////////////////////////////

    suspend fun replaceUserAccountsCache(accounts: List<UserAccount>): List<UserAccount> {
        val users = accounts.map { it.userId }.distinct()
        users.forEach {
            dao.deleteForUser(it)
        }

        accounts.forEach {
            PlaidInstitution(context, it.institution).cache()
        }

        dao.upsert(accounts)

        return accounts
    }

    suspend fun deleteAccount(userAccount: UserAccount) {
        dao.delete(userAccount)
    }

    suspend fun findAccountsForUser(user: User): List<UserAccount> {
        return dao.findAccountsForUser(user.id)
    }

    fun observeAccountsForUser(user: User): Flow<List<UserAccount>> {
        return dao.observeAccountsForUser(user.id).distinctUntilChanged()
    }

    suspend fun findAccountThatRequiresReAuthentication(user: User): UserAccount? {
        val accounts = findAccountsForUser(user)

        return accounts.find { it.requiresPlaidReAuthentication }
    }

    suspend fun updateAccountCache(account: UserAccount) {
        dao.upsert(account)
    }

    // ///////////////////////////////
    // HTTP API
    // ///////////////////////////////

    suspend fun fetchAccountsFromApi(): List<UserAccount>? {
        val accounts = api.fetchUserAccounts().body()

        accounts?.let { list ->
            if (list.isNotEmpty()) {
                replaceUserAccountsCache(list)
            }
        }

        return accounts
    }

    suspend fun linkBankAccount(dto: PlaidLinkResponse): Response<PatchBankAccountResponse> {
        return api.linkBankAccount(dto)
    }

    suspend fun updateBankAccount(accountId: Int): Response<UserAccount> {
        return api.updateBankAccount(accountId)
    }

    suspend fun unlinkBankAccount(userAccount: UserAccount): Int {
        val apiResponse = api.unlinkBankAccount(userAccount.id)
        val responseStatus = apiResponse.code()
        if (responseStatus == 200) {
            apiResponse.body()?.let { body ->
                userRepository.insertOrUpdateUser(body.user)
                replaceUserAccountsCache(body.userAccounts)
            }
        }

        return responseStatus
    }
}
