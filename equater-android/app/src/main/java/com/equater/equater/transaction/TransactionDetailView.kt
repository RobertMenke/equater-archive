package com.equater.equater.transaction

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.equater.equater.components.LoadingColumn
import com.equater.equater.components.Section
import com.equater.equater.manageAgreements.AgreementViewModel
import com.equater.equater.sharedExpenseCreation.TransactionStory

@Composable
fun TransactionDetailViewFromDeepLink(
    navController: NavController,
    agreementViewModel: AgreementViewModel,
    transactionViewModel: TransactionViewModel,
    transactionId: Int
) {
    val transactions by transactionViewModel.transactions.collectAsState()
    val hasTransactions by derivedStateOf { transactions.isNotEmpty() }
    var transaction by remember { mutableStateOf<TransactionStory?>(null) }
    val story = transaction

    LaunchedEffect(hasTransactions) {
        if (hasTransactions) {
            transaction = transactionViewModel.transactions.value.firstOrNull { it.transaction.id == transactionId }
        }
    }

    if (story != null) {
        TransactionDetailView(navController = navController, agreementViewModel = agreementViewModel, story = story)
    } else {
        LoadingColumn(height = 150.dp)
    }
}

@Composable
fun TransactionDetailView(
    navController: NavController,
    agreementViewModel: AgreementViewModel,
    story: TransactionStory,
    modifier: Modifier = Modifier
) {
    val agreements by agreementViewModel.agreements.collectAsState()
    val sharedExpenseStory = agreements.firstOrNull { it.sharedExpense.id == story.sharedExpense.id } ?: return

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp)
    ) {
        item("Payer") {
            Section(title = "Payer") {
                TransactionParticipantCard(
                    user = story.payer,
                    role = TransactionParticipantRole.PAYER,
                    amount = story.transaction.totalTransactionAmount
                )
            }
        }
        item("Recipient") {
            Section(title = "Recipient") {
                TransactionParticipantCard(
                    user = story.recipient,
                    role = TransactionParticipantRole.RECIPIENT,
                    amount = story.transaction.totalTransactionAmount
                )
            }
        }
        item("Agreement") {
            Section(title = "Agreement") {
                TransactionAgreementCard(story = story, sharedExpenseStory = sharedExpenseStory) {
                    navController.navigate("agreement/detail/${story.sharedExpense.id}")
                }
            }
        }
        item("Detail") {
            Section(title = "Detail") {
                TransactionDetailCard(story = story)
            }
        }
    }
}
