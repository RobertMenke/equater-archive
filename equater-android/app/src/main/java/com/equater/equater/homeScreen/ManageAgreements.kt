package com.equater.equater.homeScreen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.Button
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Tab
import androidx.compose.material.TabRow
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.authentication.EmailConfirmationDialog
import com.equater.equater.components.NotFound
import com.equater.equater.manageAgreements.AgreementCard
import com.equater.equater.manageAgreements.AgreementViewModel
import com.equater.equater.navigation.Route
import com.equater.equater.sharedExpenseCreation.SharedExpenseStory
import com.equater.equater.sharedExpenseCreation.filterByActive
import com.equater.equater.sharedExpenseCreation.filterByCanceled
import com.equater.equater.sharedExpenseCreation.filterByInvitations
import com.equater.equater.sharedExpenseCreation.filterByPendingWithoutInvitation
import com.equater.equater.ui.backgroundPrimary
import com.equater.equater.ui.textPrimaryColor
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState

private val tabTitles = listOf("Active", "Pending", "Canceled")

@Composable
fun ManageAgreements(
    navController: NavHostController,
    authViewModel: AuthenticationViewModel,
    agreementViewModel: AgreementViewModel,
    initialTabIndex: Int
) {
    val authenticatedUser by authViewModel.authenticatedUser.collectAsState()
    val user = authenticatedUser ?: return
    val agreements by agreementViewModel.agreements.collectAsState()
    var selectedTab by remember { mutableStateOf(initialTabIndex) }
    val showEmailConfirmation by agreementViewModel.showEmailConfirmation.collectAsState()
    val isRefreshing by agreementViewModel.isRefreshingAgreements.collectAsState()
    val isSyncingAgreements by agreementViewModel.isSyncingAgreements.collectAsState()
    val context = LocalContext.current

    if (showEmailConfirmation) {
        EmailConfirmationDialog(authViewModel) {
            agreementViewModel.showEmailConfirmation.value = false
        }
    }

    fun LazyListScope.agreementList(list: List<SharedExpenseStory>) {
        items(list.size, { index -> list[index].sharedExpense.id }) { index ->
            val story = list[index]
            AgreementCard(user, story, agreementViewModel) {
                navController.navigate("agreement/detail/${story.sharedExpense.id}")
            }
        }
    }

    @Composable fun ActiveAgreementColumn() {
        val filteredAgreements = agreements.filterByActive()

        when {
            filteredAgreements.isNotEmpty() -> {
                LazyColumn { agreementList(filteredAgreements) }
            }
            isSyncingAgreements -> {
                Row(
                    modifier = Modifier.fillMaxWidth().height(250.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CircularProgressIndicator(color = textPrimaryColor(), strokeWidth = 1.dp)
                }
            }
            else -> {
                val listState = rememberLazyListState()
                SwipeRefresh(
                    state = rememberSwipeRefreshState(isRefreshing),
                    onRefresh = {
                        agreementViewModel.refreshAgreements(context) {
                            listState.animateScrollToItem(0)
                        }
                    }
                ) {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        item {
                            NotFound(text = "Awaiting your first agreement")
                        }
                        item {
                            Button(
                                onClick = { navController.navigate(Route.CreateAgreement.route) },
                                modifier = Modifier
                                    .padding(top = 16.dp)
                                    .fillMaxWidth(),
                                contentPadding = PaddingValues(vertical = 16.dp)
                            ) {
                                Text(
                                    text = "Create one now!",
                                    style = MaterialTheme.typography.body1.copy(
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable fun PendingAgreementColumn() {
        val invitations = agreements.filterByInvitations(user)
        val pendingWithoutInvitation = agreements.filterByPendingWithoutInvitation(user)

        when {
            invitations.isNotEmpty() || pendingWithoutInvitation.isNotEmpty() -> {
                LazyColumn {
                    if (invitations.isNotEmpty()) {
                        item("invitation") {
                            Text(
                                text = "Invitations",
                                style = MaterialTheme.typography.h2,
                                modifier = Modifier.padding(vertical = 4.dp)
                            )
                        }
                        agreementList(invitations)
                    }

                    if (pendingWithoutInvitation.isNotEmpty()) {
                        item("waiting_on_others") {
                            Text(
                                text = "Waiting on others",
                                style = MaterialTheme.typography.h2,
                                modifier = Modifier.padding(vertical = 4.dp)
                            )
                        }
                        agreementList(pendingWithoutInvitation)
                    }
                }
            }
            isSyncingAgreements -> {
                Row(
                    modifier = Modifier.fillMaxWidth().height(250.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CircularProgressIndicator(color = textPrimaryColor(), strokeWidth = 1.dp)
                }
            }
            else -> {
                val listState = rememberLazyListState()
                SwipeRefresh(
                    state = rememberSwipeRefreshState(isRefreshing),
                    onRefresh = {
                        agreementViewModel.refreshAgreements(context) {
                            listState.animateScrollToItem(0)
                        }
                    }
                ) {
                    LazyColumn {
                        item {
                            NotFound(text = "No pending agreements")
                        }
                    }
                }
            }
        }
    }

    @Composable fun CanceledAgreementColumn() {
        val filteredAgreements = agreements.filterByCanceled()
        when {
            filteredAgreements.isNotEmpty() -> {
                LazyColumn { agreementList(filteredAgreements) }
            }
            isSyncingAgreements -> {
                Row(
                    modifier = Modifier.fillMaxWidth().height(250.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CircularProgressIndicator(color = textPrimaryColor(), strokeWidth = 1.dp)
                }
            }
            else -> {
                val listState = rememberLazyListState()
                SwipeRefresh(
                    state = rememberSwipeRefreshState(isRefreshing),
                    onRefresh = {
                        agreementViewModel.refreshAgreements(context) {
                            listState.animateScrollToItem(0)
                        }
                    }
                ) {
                    LazyColumn {
                        item {
                            NotFound(text = "No canceled agreements")
                        }
                    }
                }
            }
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            TabRow(selectedTabIndex = selectedTab, backgroundColor = backgroundPrimary()) {
                tabTitles.forEachIndexed { index, title ->
                    Tab(
                        text = { Text(title) },
                        selected = selectedTab == index,
                        onClick = { selectedTab = index }
                    )
                }
            }

            val listState = rememberLazyListState()
            SwipeRefresh(
                state = rememberSwipeRefreshState(isRefreshing),
                onRefresh = {
                    agreementViewModel.refreshAgreements(context) {
                        listState.animateScrollToItem(0)
                    }
                }
            ) {
                Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)) {
                    when (selectedTab) {
                        0 -> ActiveAgreementColumn()
                        1 -> PendingAgreementColumn()
                        2 -> CanceledAgreementColumn()
                        else -> {}
                    }
                }
            }
        }
    }
}
