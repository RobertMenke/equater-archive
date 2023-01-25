package com.equater.equater.searchUsers

import android.content.Context
import android.widget.Toast
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.equater.equater.authentication.User
import com.equater.equater.database.repository.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class UserSearchViewModel @Inject constructor(private val userRepository: UserRepository) : ViewModel() {
    // Search query should be updated, and debouncedSearchQuery should
    // be used to trigger new searches
    val searchQuery = MutableStateFlow("")

    @OptIn(FlowPreview::class)
    val debouncedSearchQuery = searchQuery
        .debounce(800L)
        // Turn on the searching state here to avoid a flash of unwanted content in the composition
        .onEach { if (it.trim().isNotEmpty()) isSearching.value = true }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(), "")

    val isSearching = MutableStateFlow(false)

    private val authenticatedUser = userRepository.observeAuthenticatedUser().stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(),
        null
    )

    @OptIn(ExperimentalCoroutinesApi::class)
    val relationships = authenticatedUser
        .filterNotNull()
        .flatMapLatest { userRepository.observeRelationships(it.id) }
        .map { list -> list.map { relationship -> relationship.user } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(), listOf())

    // Exclusively gets search results from the server
    val userSearchResults = MutableStateFlow<List<User>>(listOf())

    val selectedUsers = MutableStateFlow<List<User>>(listOf())

    val selectedEmails = MutableStateFlow<List<String>>(listOf())

    fun selectUser(user: User) {
        selectedUsers.value = selectedUsers.value.plus(user)
    }

    fun removeSelectedUser(user: User) {
        selectedUsers.value = selectedUsers.value.minus(user)
    }

    fun selectEmail(email: String) {
        selectedEmails.value = selectedEmails.value.plus(email.trim()).distinct()
    }

    fun removeSelectedEmail(email: String) {
        selectedEmails.value = selectedEmails.value.minus(email)
    }

    // Important: isSearching.value is set to true when the debounced input changes
    // so that we avoid a flash of unstyled content
    fun searchUsers(context: Context) {
        val query = searchQuery.value.trim()
        userSearchResults.value = listOf()

        if (query.isEmpty()) {
            isSearching.value = false
            return
        }

        viewModelScope.launch {
            try {
                val response = userRepository.searchUsers(query)
                userSearchResults.value = response.friends.plus(response.users)
            } catch (e: Throwable) {
                Timber.e(e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(context, "Failed to search users", Toast.LENGTH_LONG).show()
                }

                userSearchResults.value = listOf()
            }

            isSearching.value = false
        }
    }
}
