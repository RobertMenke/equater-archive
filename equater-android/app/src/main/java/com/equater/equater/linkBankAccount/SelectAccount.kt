package com.equater.equater.linkBankAccount

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
import androidx.compose.material.Button
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.material.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.authentication.PlaidTokenType
import com.equater.equater.authentication.UserAccount
import com.equater.equater.ui.accentPrimaryForText
import com.equater.equater.ui.textPrimary
import com.equater.equater.ui.textSecondaryColor
import kotlinx.coroutines.launch
import kotlinx.serialization.ExperimentalSerializationApi

@OptIn(ExperimentalSerializationApi::class)
@Composable
fun SelectAccount(
    title: String,
    type: PlaidTokenType = PlaidTokenType.AndroidDepositoryOnly,
    subtitle: String? = null,
    authenticationViewModel: AuthenticationViewModel,
    onDone: suspend (UserAccount?) -> Unit
) {
    val authenticatedUser by authenticationViewModel.authenticatedUser.collectAsState()
    val user = authenticatedUser ?: return
    val userAccounts by authenticationViewModel.authenticatedUserAccounts.collectAsState()
    val accounts = userAccounts.filter {
        when (type) {
            PlaidTokenType.AndroidDepositoryOnly -> it.accountType == "depository"
            PlaidTokenType.AndroidCreditAndDepository -> it.accountType == "depository" || it.accountType == "credit"
            else -> false
        }
    }
    val scope = rememberCoroutineScope()
    val launchPlaidLink = createPlaidLauncher(
        user = user,
        type = type,
        onAccountLinked = { account -> onDone(account) }
    )
    val isLoading by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp, horizontal = 14.dp)
                .height(52.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.End
        ) {
            TextButton(onClick = {
                scope.launch {
                    if (!isLoading) {
                        onDone(null)
                    }
                }
            }) {
                Text(
                    text = "Done",
                    style = MaterialTheme.typography.body1.copy(
                        color = accentPrimaryForText(),
                        fontWeight = FontWeight.Bold
                    )
                )
            }
        }

        if (accounts.isEmpty()) {
            SelectFirstAccount(
                user = user,
                titleText = title,
                tokenType = type,
                onSelected = onDone,
                subtitleText = subtitle
            )
        } else {
            Box(modifier = Modifier.fillMaxSize().padding(horizontal = 14.dp)) {
                Column(modifier = Modifier.fillMaxSize()) {
                    val titlePadding = if (subtitle != null) 4.dp else 12.dp

                    Text(
                        text = title,
                        style = MaterialTheme.typography.h4.copy(color = textPrimary()),
                        modifier = Modifier.padding(bottom = titlePadding)
                    )

                    if (subtitle != null) {
                        Text(
                            text = subtitle,
                            style = MaterialTheme.typography.body1.copy(color = textSecondaryColor()),
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                    }

                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(bottom = 80.dp)
                    ) {
                        accounts.forEach { account ->
                            item(account.id) {
                                BankAccountCard(account = account, onTap = { selectedAccount ->
                                    scope.launch {
                                        onDone(selectedAccount)
                                    }
                                })
                            }
                        }
                    }
                }

                Column(
                    modifier = Modifier.fillMaxSize(),
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
                            CircularProgressIndicator(
                                color = Color.White,
                                strokeWidth = 1.dp,
                                modifier = Modifier.scale(0.8f)
                            )
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
    }
}
