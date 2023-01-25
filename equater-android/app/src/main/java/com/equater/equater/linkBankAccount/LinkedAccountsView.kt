package com.equater.equater.linkBankAccount

import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.Button
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.authentication.PlaidTokenType
import com.equater.equater.components.NotFound
import kotlinx.serialization.ExperimentalSerializationApi

@OptIn(ExperimentalSerializationApi::class)
@Composable
fun LinkedAccountsView(
    navController: NavController,
    authViewModel: AuthenticationViewModel,
    plaidViewModel: PlaidViewModel = hiltViewModel()
) {
    val authenticatedUser by authViewModel.authenticatedUser.collectAsState()
    val user = authenticatedUser ?: return
    val accounts by authViewModel.authenticatedUserAccounts.collectAsState()
    val isLoading by plaidViewModel.isLoading.collectAsState()
    val context = LocalContext.current

    val launchPlaidLink = createPlaidLauncher(
        user = user,
        type = PlaidTokenType.AndroidCreditAndDepository,
        onAccountLinked = { Toast.makeText(context, "Account linked successfully", Toast.LENGTH_SHORT).show() }
    )

    Box(modifier = Modifier.fillMaxSize()) {
        if (accounts.isNotEmpty()) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 14.dp)
                    .padding(bottom = 80.dp)
            ) {
                items(accounts.size, { index -> accounts[index].id }) { index ->
                    val account = accounts[index]
                    BankAccountCard(
                        account = account,
                        onTap = { selectedAccount ->
                            navController.navigate("accounts/${selectedAccount.id}")
                        },
                        includeTrailingIcon = true
                    )
                }
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 14.dp)
                    .padding(bottom = 80.dp)
            ) {
                NotFound(text = "When you link bank accounts they'll show up here")
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
                        text = if (accounts.isNotEmpty()) "Link Another Account" else "Link Account",
                        style = MaterialTheme.typography.body1.copy(fontSize = 3.5.em, color = Color.White)
                    )
                }
            }
        }
    }
}
