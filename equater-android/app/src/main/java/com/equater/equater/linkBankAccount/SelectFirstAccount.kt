package com.equater.equater.linkBankAccount

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
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
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.hilt.navigation.compose.hiltViewModel
import com.equater.equater.R
import com.equater.equater.authentication.PlaidTokenType
import com.equater.equater.authentication.User
import com.equater.equater.authentication.UserAccount
import com.equater.equater.ui.textPrimary
import com.equater.equater.ui.textSecondaryColor
import kotlinx.serialization.ExperimentalSerializationApi

@OptIn(ExperimentalSerializationApi::class)
@Composable
fun SelectFirstAccount(
    user: User,
    titleText: String,
    tokenType: PlaidTokenType,
    onSelected: suspend (UserAccount) -> Unit,
    modifier: Modifier = Modifier,
    subtitleText: String? = null
) {
    val viewModel: PlaidViewModel = hiltViewModel()
    val isLoading by viewModel.isLoading.collectAsState()
    val launchPlaidLink = createPlaidLauncher(
        user = user,
        type = tokenType,
        onAccountLinked = onSelected
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Image(
            painter = painterResource(id = R.drawable.wallet),
            contentDescription = "Wallet icon",
            modifier = Modifier.fillMaxWidth(0.7f)
        )

        Text(
            text = titleText,
            style = MaterialTheme.typography.h4.copy(color = textPrimary()),
            modifier = Modifier.padding(vertical = 12.dp)
        )

        if (subtitleText != null) {
            Text(
                text = subtitleText,
                style = MaterialTheme.typography.body1.copy(color = textSecondaryColor()),
                modifier = Modifier.padding(bottom = 12.dp)
            )
        }

        Button(
            onClick = { if (!isLoading) launchPlaidLink() },
            modifier = Modifier
                .padding(top = 20.dp)
                .fillMaxWidth(),
            contentPadding = PaddingValues(vertical = if (isLoading) 10.dp else 18.dp)
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
