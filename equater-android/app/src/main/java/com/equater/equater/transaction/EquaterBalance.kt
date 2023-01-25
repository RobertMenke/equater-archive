package com.equater.equater.transaction

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.equater.equater.R
import com.equater.equater.authentication.AuthenticationViewModel

@Composable fun EquaterBalance(authViewModel: AuthenticationViewModel) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = "Equater Balance", style = MaterialTheme.typography.h4)
            Text(text = authViewModel.getTotalBalanceFormatted(), style = MaterialTheme.typography.h4)
        }

        Column {
            Text(
                text = context.getString(R.string.equater_balance_description),
                style = MaterialTheme.typography.body1,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            Text(
                text = "If you’d like to learn more, contact support at (727) 437-2069 or email support@equater.app.",
                style = MaterialTheme.typography.body1
            )
        }
    }
}
