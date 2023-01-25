package com.equater.equater.linkBankAccount

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.Button
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.material.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import com.equater.equater.R
import com.equater.equater.authentication.UserAccount
import com.equater.equater.ui.accentPrimaryForText
import com.equater.equater.ui.textPrimary
import com.equater.equater.ui.textSecondaryColor
import kotlinx.coroutines.launch

@Composable
fun ReLinkBankAccount(account: UserAccount, onSuccess: suspend (UserAccount?) -> Unit) {
    val scope = rememberCoroutineScope()
    val launchPlaidLink = createPlaidLauncher(
        account = account,
        onAccountLinked = { updatedAccount -> onSuccess(updatedAccount) }
    )
    val isLoading by remember { mutableStateOf(false) }
    val context = LocalContext.current

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
                scope.launch { onSuccess(null) }
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

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 22.dp)
                .padding(bottom = 52.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Image(
                painter = painterResource(id = R.drawable.wallet),
                contentDescription = "Wallet icon",
                modifier = Modifier.fillMaxWidth(0.7f)
            )

            Text(
                text = "Bank Login Required",
                style = MaterialTheme.typography.h4.copy(color = textPrimary(), textAlign = TextAlign.Center),
                modifier = Modifier.padding(top = 12.dp, bottom = 4.dp)
            )

            Text(
                text = context.getString(R.string.relink_bank_account_description, account.institutionName),
                style = MaterialTheme.typography.body1.copy(color = textSecondaryColor(), textAlign = TextAlign.Start),
                modifier = Modifier.padding(vertical = 4.dp)
            )

            Button(
                onClick = { launchPlaidLink() },
                modifier = Modifier
                    .padding(top = 20.dp)
                    .fillMaxWidth(),
                contentPadding = PaddingValues(vertical = if (isLoading) 10.dp else 18.dp)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White, strokeWidth = 1.dp, modifier = Modifier.scale(0.8f))
                } else {
                    Text(
                        text = "Link Account",
                        style = MaterialTheme.typography.body1.copy(fontSize = 3.5.em, color = Color.White)
                    )
                }
            }
        }
    }
}
