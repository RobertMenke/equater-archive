package com.equater.equater.transaction

import android.content.Context
import android.widget.Toast
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.equater.equater.database.repository.TransactionRepository
import com.equater.equater.database.repository.UserRepository
import com.equater.equater.global.SignInEvent
import com.equater.equater.searchVendors.Vendor
import com.equater.equater.sharedExpenseCreation.TransactionStory
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import org.greenrobot.eventbus.EventBus
import org.greenrobot.eventbus.Subscribe
import org.greenrobot.eventbus.ThreadMode
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class TransactionViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val transactionRepository: TransactionRepository
) : ViewModel() {

    init {
        EventBus.getDefault().register(this)
    }

    val isRefreshingAgreements = MutableStateFlow(false)
    val isLoading = MutableStateFlow(false)
    private val authenticatedUser = userRepository.observeAuthenticatedUser().stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(),
        null
    )

    // Share eagerly to re-fetch/re-hydrate on any user change
    @OptIn(ExperimentalCoroutinesApi::class)
    val transactions: StateFlow<List<TransactionStory>> = authenticatedUser
        .distinctUntilChanged { old, new -> old?.equals(new) == true }
        .flatMapLatest { user ->
            if (user != null) {
                transactionRepository.observeTransactions(user.id)
            } else {
                MutableStateFlow(listOf())
            }
        }
        .stateIn(viewModelScope, SharingStarted.Eagerly, listOf())

    fun syncTransactions(userId: Int) {
        viewModelScope.launch(Dispatchers.IO) {
            isLoading.value = true
            transactionRepository.fetchTransactions(userId)
            isLoading.value = false
        }
    }

    fun refreshTransactions(context: Context, andThen: suspend () -> Unit) {
        val user = authenticatedUser.value ?: return

        isRefreshingAgreements.value = true
        viewModelScope.launch {
            try {
                transactionRepository.fetchTransactions(user.id)
                andThen()
            } catch (e: Throwable) {
                Timber.e(e)
                Toast.makeText(context, "Failed to refresh agreements", Toast.LENGTH_LONG).show()
            }

            isRefreshingAgreements.value = false
        }
    }

    fun findVendorById(id: Int): Vendor? {
        val transaction = transactions.value.firstOrNull { it.vendor?.id == id }

        return transaction?.vendor
    }

    @Subscribe(threadMode = ThreadMode.BACKGROUND)
    fun signInEvent(event: SignInEvent) {
        viewModelScope.launch {
            syncTransactions(event.signInResponse.user.id)
        }
    }
}
