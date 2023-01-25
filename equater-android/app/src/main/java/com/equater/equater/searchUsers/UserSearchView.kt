package com.equater.equater.searchUsers

import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.material.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.equater.equater.components.LoadingColumn
import com.equater.equater.components.SearchBar
import com.equater.equater.ui.accentPrimaryForText

@OptIn(ExperimentalAnimationApi::class, ExperimentalComposeUiApi::class)
@Composable
fun UserSearchView(onDone: (Boolean) -> Unit, userSearchViewModel: UserSearchViewModel = hiltViewModel()) {
    val context = LocalContext.current
    val searchText by userSearchViewModel.searchQuery.collectAsState()
    val debouncedSearchText by userSearchViewModel.debouncedSearchQuery.collectAsState()
    val isSearching by userSearchViewModel.isSearching.collectAsState()
    val selectedUsers by userSearchViewModel.selectedUsers.collectAsState()
    val relationships by userSearchViewModel.relationships.collectAsState()
    val userSearchResults by userSearchViewModel.userSearchResults.collectAsState()
    // Search results minus selected users
    val searchResults = userSearchResults.filter { user ->
        !selectedUsers.any { selectedUser -> selectedUser.id == user.id }
    }
    // Relationships minus selected relationships
    val remainingRelationships = relationships.filter { user ->
        !selectedUsers.any { selectedUser -> selectedUser.id == user.id }
    }

    LaunchedEffect(debouncedSearchText) {
        userSearchViewModel.searchUsers(context)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp)
                .height(52.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = "Add Payers", style = MaterialTheme.typography.h4)
            TextButton(onClick = { onDone(false) }) {
                Text(
                    text = "Done",
                    style = MaterialTheme.typography.body1.copy(
                        color = accentPrimaryForText(),
                        fontWeight = FontWeight.Bold
                    )
                )
            }
        }

        SearchBar(
            searchText = searchText,
            placeholderText = "Search",
            onSearchTextChanged = { userSearchViewModel.searchQuery.value = it },
            onClearClick = { userSearchViewModel.searchQuery.value = "" },
            onNavigateBack = { onDone(true) },
            isLoading = isSearching
        )

        UserSelectionRow()

        when {
            // Show a loading spinner
            isSearching -> {
                LoadingColumn(height = 150.dp)
            }
            // Display search results
            searchResults.isNotEmpty() -> {
                LazyColumn(modifier = Modifier.padding(top = 8.dp)) {
                    items(searchResults.size, { index -> searchResults[index].id }) { index ->
                        val user = searchResults[index]
                        UserCard(user, onClick = {
                            userSearchViewModel.selectUser(it)
                        })
                    }
                }
            }
            // No results found while searching
            debouncedSearchText.trim().isNotEmpty() -> {
                AddByEmailPrompt()
            }
            // Show existing relationships for quick additions
            else -> {
                LazyColumn(modifier = Modifier.padding(top = 8.dp)) {
                    items(remainingRelationships.size, { index -> remainingRelationships[index].id }) { index ->
                        val user = remainingRelationships[index]
                        UserCard(user, onClick = {
                            userSearchViewModel.selectUser(it)
                        })
                    }
                }
            }
        }
    }
}
