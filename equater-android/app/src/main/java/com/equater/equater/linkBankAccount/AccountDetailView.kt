package com.equater.equater.linkBankAccount

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.Divider
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.authentication.User
import com.equater.equater.authentication.UserAccount
import com.equater.equater.components.BankAccountPhoto
import com.equater.equater.components.SlideToConfirm
import com.equater.equater.components.SlideToConfirmResult
import com.equater.equater.manageAgreements.AgreementCard
import com.equater.equater.manageAgreements.AgreementViewModel
import com.equater.equater.profile.PlaidInstitution
import com.equater.equater.sharedExpenseCreation.SharedExpenseStory
import com.equater.equater.sharedExpenseCreation.filterByActiveUsingAccount
import com.equater.equater.ui.backgroundSecondary
import com.equater.equater.ui.textPrimaryColor
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun AccountDetailView(
    navController: NavController,
    authViewModel: AuthenticationViewModel,
    agreementViewModel: AgreementViewModel,
    account: UserAccount
) {
    val authenticatedUser by authViewModel.authenticatedUser.collectAsState()
    val user = authenticatedUser ?: return
    val agreements by agreementViewModel.agreements.collectAsState()
    val agreementsUsingAccount = agreements.filterByActiveUsingAccount(account)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = 100.dp)
        ) {
            AccountPictureAndName(account)
            Divider(color = backgroundSecondary())
            ActiveAgreements(navController, agreementViewModel, user, agreementsUsingAccount)
        }
        UnlinkAccount(navController, account, agreementsUsingAccount)
    }
}

@Composable private fun ColumnScope.AccountPictureAndName(
    account: UserAccount
) {
    val context = LocalContext.current
    val photo = remember { PlaidInstitution(context, account.institution) }

    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .weight(0.6f)
            .fillMaxWidth()
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.fillMaxSize()
        ) {
            BankAccountPhoto(
                photo = photo,
                modifier = Modifier.padding(horizontal = 16.dp),
                size = 80.dp
            )
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    account.institutionName,
                    style = MaterialTheme.typography.body1.copy(fontSize = 18.sp, fontWeight = FontWeight.Bold)
                )
                Text(
                    account.accountName,
                    style = MaterialTheme.typography.body2.copy(fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                )
            }
        }
    }
}

@Composable private fun ColumnScope.ActiveAgreements(
    navController: NavController,
    agreementViewModel: AgreementViewModel,
    user: User,
    agreements: List<SharedExpenseStory>
) {
    Box(
        modifier = Modifier
            .weight(1.5f)
            .background(MaterialTheme.colors.background)
    ) {
        Column {
            if (agreements.isNotEmpty()) {
                Text(
                    "Agreements Using Account",
                    style = MaterialTheme.typography.body1.copy(
                        color = textPrimaryColor(),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    ),
                    modifier = Modifier.padding(vertical = 4.dp)
                )
                LazyColumn {
                    items(agreements.size, { index -> agreements[index].sharedExpense.id }) { index ->
                        val story = agreements[index]
                        AgreementCard(user, story, agreementViewModel) {
                            navController.navigate("agreement/detail/${story.sharedExpense.id}")
                        }
                    }
                }
            } else {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        "No active agreements using account",
                        style = MaterialTheme.typography.body1.copy(fontSize = 18.sp)
                    )
                }
            }
        }
    }
}

@Composable private fun UnlinkAccount(
    navController: NavController,
    account: UserAccount,
    agreements: List<SharedExpenseStory>,
    plaidViewModel: PlaidViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.Bottom,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        SlideToConfirm(
            slideInstructionText = "Swipe to Unlink Account",
            feedbackText = "Account Removed",
            completion = { statusCallback ->
                if (agreements.isNotEmpty()) {
                    Toast.makeText(
                        context,
                        "In order to unlink your account cancel any active agreements you have using the account.",
                        Toast.LENGTH_LONG
                    ).show()
                    statusCallback(SlideToConfirmResult.FAILURE)
                } else {
                    scope.launch {
                        plaidViewModel.unlinkBankAccount(account) { didSucceed ->
                            if (didSucceed) {
                                statusCallback(SlideToConfirmResult.SUCCESS)
                                scope.launch {
                                    delay(300)
                                    navController.popBackStack()
                                }
                            } else {
                                Toast.makeText(context, "Failed to unlink account", Toast.LENGTH_LONG).show()
                                statusCallback(SlideToConfirmResult.FAILURE)
                            }
                        }
                    }
                }
            }
        )
    }
}
