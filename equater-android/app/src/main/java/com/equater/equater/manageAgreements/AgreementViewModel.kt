package com.equater.equater.manageAgreements

import android.content.Context
import android.content.SharedPreferences
import android.widget.Toast
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.equater.equater.authentication.UserAccount
import com.equater.equater.database.repository.AgreementRepository
import com.equater.equater.database.repository.UserRepository
import com.equater.equater.extensions.EquaterPreference
import com.equater.equater.global.SignInEvent
import com.equater.equater.sharedExpenseCreation.CancelAgreementDto
import com.equater.equater.sharedExpenseCreation.SharedExpenseStory
import com.equater.equater.sharedExpenseCreation.UserAgreementDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import org.greenrobot.eventbus.EventBus
import org.greenrobot.eventbus.Subscribe
import org.greenrobot.eventbus.ThreadMode
import retrofit2.HttpException
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class AgreementViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val agreementRepository: AgreementRepository,
    private val preferences: SharedPreferences
) : ViewModel() {

    init {
        EventBus.getDefault().register(this)
    }

    private val authenticatedUser = userRepository.observeAuthenticatedUser().stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(),
        null
    )
    private val authenticatedUserId = authenticatedUser.filterNotNull().map { it.id }

    val isSyncingAgreements = MutableStateFlow(false)
    val showPaymentAccountSelection = MutableStateFlow(false)

    // Can be used as a universal loading indicator for
    val isLoading = MutableStateFlow(false)

    val showEmailConfirmation = MutableStateFlow(false)

    var afterPaymentAccountLinked = MutableStateFlow<suspend (UserAccount) -> Unit> {}

    // Map of shared expense ids to payment account ids
    private val paymentAccountMap = MutableStateFlow(hashMapOf<Int, Int>())

    private val linkingPaymentAccountForExpenseId: MutableStateFlow<Int?> = MutableStateFlow(null)

    val isRefreshingAgreements = MutableStateFlow(false)

    // Share eagerly to re-fetch/re-hydrate on any user change
    @OptIn(ExperimentalCoroutinesApi::class)
    val agreements: StateFlow<List<SharedExpenseStory>> = authenticatedUserId
        .flatMapLatest { userId ->
            agreementRepository.observeAgreements(userId)
        }
        .stateIn(viewModelScope, SharingStarted.Eagerly, listOf())

    fun syncUserAgreements(userId: Int) {
        viewModelScope.launch(Dispatchers.IO) {
            isSyncingAgreements.value = true
            agreementRepository.fetchSharedExpenses(userId)
            isSyncingAgreements.value = false
        }
    }

    private fun getSavedPaymentAccountId(): Int? {
        val user = authenticatedUser.value ?: return null
        val id = preferences.getInt("${user.id}-${EquaterPreference.PaymentAccount.preferenceName}", 0)

        if (id == 0) {
            return null
        }

        return id
    }

    fun setSavedPaymentAccountId(id: Int) {
        val user = authenticatedUser.value ?: return

        preferences.edit().putInt("${user.id}-${EquaterPreference.PaymentAccount.preferenceName}", id).apply()
    }

    fun getPaymentAccountId(sharedExpenseId: Int): Int? {
        return paymentAccountMap.value[sharedExpenseId] ?: getSavedPaymentAccountId()
    }

    fun setPaymentAccountId(accountId: Int) {
        val sharedExpenseId = linkingPaymentAccountForExpenseId.value ?: return

        paymentAccountMap.value[sharedExpenseId] = accountId
    }

    // This opens up a full screen sheet from MainComposable
    fun showAccountSelection(sharedExpenseId: Int, andThen: suspend (UserAccount) -> Unit) {
        linkingPaymentAccountForExpenseId.value = sharedExpenseId
        showPaymentAccountSelection.value = true
        afterPaymentAccountLinked.value = andThen
    }

    fun refreshAgreements(context: Context, andThen: suspend () -> Unit) {
        val user = authenticatedUser.value ?: return

        isRefreshingAgreements.value = true
        viewModelScope.launch {
            try {
                agreementRepository.fetchSharedExpenses(user.id)
                andThen()
            } catch (e: Throwable) {
                Timber.e(e)
                Toast.makeText(context, "Failed to refresh agreements", Toast.LENGTH_LONG).show()
            }

            isRefreshingAgreements.value = false
        }
    }

    fun cancelAgreementAsync(sharedExpenseId: Int) = viewModelScope.async(Dispatchers.IO) {
        val user = userRepository.findAuthenticatedUser() ?: throw IllegalStateException("Authenticated user not found")
        val dto = CancelAgreementDto(sharedExpenseId)
        val response = agreementRepository.cancelAgreement(dto)
        val story = response.body() ?: throw HttpException(response)
        agreementRepository.insertAgreement(user.id, story)

        return@async story
    }

    fun acceptAgreementAsync(agreementId: Int, paymentAccountId: Int) = viewModelScope.async(Dispatchers.IO) {
        val user = userRepository.findAuthenticatedUser() ?: throw IllegalStateException("Authenticated user not found")
        val dto = UserAgreementDto(
            userAgreementId = agreementId,
            doesAcceptAgreement = true,
            paymentAccountId = paymentAccountId
        )
        val response = agreementRepository.updateAgreement(dto)
        val story = response.body() ?: throw HttpException(response)
        agreementRepository.insertAgreement(user.id, story)

        return@async story
    }

    fun declineAgreementAsync(agreementId: Int) = viewModelScope.async(Dispatchers.IO) {
        val user = userRepository.findAuthenticatedUser() ?: throw IllegalStateException("Authenticated user not found")
        val dto = UserAgreementDto(userAgreementId = agreementId, doesAcceptAgreement = false, paymentAccountId = null)
        val response = agreementRepository.updateAgreement(dto)
        val story = response.body() ?: throw HttpException(response)
        agreementRepository.insertAgreement(user.id, story)

        return@async story
    }

    @Subscribe(threadMode = ThreadMode.BACKGROUND)
    fun signInEvent(event: SignInEvent) {
        viewModelScope.launch {
            syncUserAgreements(event.signInResponse.user.id)
        }
    }
}
