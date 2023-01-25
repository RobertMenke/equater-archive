package com.equater.equater.linkBankAccount

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.Button
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Switch
import androidx.compose.material.SwitchDefaults
import androidx.compose.material.Text
import androidx.compose.material.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.authentication.PlaidTokenType
import com.equater.equater.authentication.User
import com.equater.equater.authentication.UserAccount
import com.equater.equater.manageAgreements.AgreementViewModel
import com.equater.equater.ui.accentPrimaryForText
import com.equater.equater.ui.textPrimary
import com.equater.equater.ui.textPrimaryColor
import kotlinx.coroutines.launch
import kotlinx.serialization.ExperimentalSerializationApi

@OptIn(ExperimentalSerializationApi::class)
@Composable
fun SelectPaymentAccount(
    agreementViewModel: AgreementViewModel,
    authenticationViewModel: AuthenticationViewModel,
    titleText: String,
    setIsShowing: (Boolean) -> Unit,
    onSelected: suspend (UserAccount) -> Unit,
    modifier: Modifier = Modifier
) {
    val authenticatedUser by authenticationViewModel.authenticatedUser.collectAsState()
    val user = authenticatedUser ?: return
    val accounts by authenticationViewModel.authenticatedUserAccounts.collectAsState()
    val depositoryAccounts = accounts.filter { it.accountType == "depository" }
    val config = LocalConfiguration.current
    val width = config.screenWidthDp

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Spacer(modifier = modifier.width(width.dp - 80.dp))
        TextButton(onClick = { setIsShowing(false) }) {
            Text(
                text = "Done",
                style = MaterialTheme.typography.body1.copy(
                    color = accentPrimaryForText(),
                    fontWeight = FontWeight.Bold
                )
            )
        }
    }

    if (depositoryAccounts.isEmpty()) {
        SelectFirstAccount(
            user = user,
            titleText = titleText,
            tokenType = PlaidTokenType.AndroidDepositoryOnly,
            onSelected = { account -> onSelected(account) },
            modifier = modifier
        )
    } else {
        SelectDepositoryAccount(
            agreementViewModel = agreementViewModel,
            user = user,
            depositoryAccounts = depositoryAccounts,
            titleText = titleText,
            onSelected = { account -> onSelected(account) },
            modifier = modifier
        )
    }
}

@OptIn(ExperimentalSerializationApi::class)
@Composable
private fun SelectDepositoryAccount(
    agreementViewModel: AgreementViewModel,
    user: User,
    depositoryAccounts: List<UserAccount>,
    titleText: String,
    onSelected: suspend (UserAccount) -> Unit,
    modifier: Modifier = Modifier
) {
    val viewModel: PlaidViewModel = hiltViewModel()
    val isLoading by viewModel.isLoading.collectAsState()
    var rememberSelection by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val selectAccount: (UserAccount) -> Unit = { account ->
        if (rememberSelection) {
            agreementViewModel.setSavedPaymentAccountId(account.id)
        }

        scope.launch {
            onSelected(account)
        }
    }
    val launchPlaidLink = createPlaidLauncher(
        user = user,
        type = PlaidTokenType.AndroidDepositoryOnly,
        onAccountLinked = { account -> onSelected(account) }
    )

    Box(modifier = modifier.fillMaxSize()) {
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
        ) {
            Text(
                text = titleText,
                style = MaterialTheme.typography.h4.copy(color = textPrimary()),
                modifier = Modifier.padding(bottom = 12.dp)
            )

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Start,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .padding(top = 8.dp, bottom = 16.dp)
            ) {
                Switch(
                    modifier = Modifier.padding(horizontal = 8.dp),
                    checked = rememberSelection,
                    onCheckedChange = { rememberSelection = it },
                    colors = SwitchDefaults.colors(uncheckedThumbColor = textPrimaryColor())
                )

                Text(
                    text = "Remember my choice (don't ask again)",
                    style = MaterialTheme.typography.body2.copy(fontSize = 16.sp)
                )
            }

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(bottom = 80.dp)
            ) {
                items(depositoryAccounts.size, { index -> depositoryAccounts[index].id }) { index ->
                    val account = depositoryAccounts[index]
                    BankAccountCard(account = account, onTap = { selectedAccount ->
                        selectAccount(selectedAccount)
                    })
                }
            }
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.Bottom,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Button(
                onClick = { if (!isLoading) launchPlaidLink() },
                modifier = Modifier
                    .padding(bottom = 20.dp)
                    .fillMaxWidth(),
                contentPadding = PaddingValues(vertical = 18.dp)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White, strokeWidth = 1.dp, modifier = Modifier.scale(0.8f))
                } else {
                    Text(
                        text = "Select Account",
                        style = MaterialTheme.typography.body1.copy(fontSize = 3.5.em, color = Color.White)
                    )
                }
            }
        }
    }
}
