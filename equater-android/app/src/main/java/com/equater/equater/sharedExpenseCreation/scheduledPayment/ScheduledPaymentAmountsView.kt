package com.equater.equater.sharedExpenseCreation.scheduledPayment

import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.Button
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.material.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.equater.equater.components.CurrencyTextField
import com.equater.equater.extensions.isValidCurrencyRepresentation
import com.equater.equater.extensions.toCurrency
import com.equater.equater.extensions.toCurrencyRepresentation
import com.equater.equater.searchUsers.UserCard
import com.equater.equater.searchUsers.UserInviteCard
import com.equater.equater.sharedExpenseCreation.Contribution
import com.equater.equater.sharedExpenseCreation.ExpenseContributionType
import com.equater.equater.sharedExpenseCreation.ScheduledPaymentViewModel
import com.equater.equater.ui.accentPrimaryForText
import com.equater.equater.ui.frameFillWidth

@Composable
fun ScheduledPaymentAmountsView(
    onDone: () -> Unit,
    scheduledPaymentViewModel: ScheduledPaymentViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val activeUsers = scheduledPaymentViewModel.getActiveUsers()
    val prospectiveUsers = scheduledPaymentViewModel.getProspectiveUsers()
    val error = Error("Must enter a valid dollar amount")

    LaunchedEffect(true) {
        scheduledPaymentViewModel.setFixedContributions()
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
            Text(text = "Select Amounts", style = MaterialTheme.typography.h4)
            TextButton(onClick = {
                val viewModelError = scheduledPaymentViewModel.findError()
                if (viewModelError != null) {
                    Toast.makeText(
                        context,
                        viewModelError.message ?: "Please enter valid amounts",
                        Toast.LENGTH_LONG
                    ).show()
                } else {
                    onDone()
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

        LazyColumn(modifier = Modifier.padding(top = 8.dp)) {
            activeUsers.forEach { user ->
                val contribution = scheduledPaymentViewModel.getContribution(user) ?: return@forEach
                item {
                    val currency = contribution.contributionValue?.toCurrency() ?: 100.toCurrency()
                    var fieldValue by remember { mutableStateOf(currency.replace("$", "")) }
                    var isError by remember { mutableStateOf(false) }
                    val focusRequester = remember { FocusRequester() }
                    UserCard(
                        user,
                        subtitle = scheduledPaymentViewModel.getShortDescription(),
                        onClick = { focusRequester.requestFocus() }
                    ) {
                        CurrencyTextField(
                            value = fieldValue,
                            isError = isError,
                            focusRequester = focusRequester,
                            onValueChanged = {
                                val value = it
                                    .replace(",", "")
                                    .replace("-", "")
                                    .trim()

                                isError = !value.isValidCurrencyRepresentation()
                                if (isError) {
                                    scheduledPaymentViewModel.setError(user, error)
                                    fieldValue = value
                                    Toast.makeText(context, error.message, Toast.LENGTH_SHORT).show()
                                } else {
                                    scheduledPaymentViewModel.setContribution(
                                        user,
                                        Contribution(ExpenseContributionType.FIXED, value.toCurrencyRepresentation())
                                    )
                                    fieldValue = value
                                }
                            }
                        )
                    }
                }
            }

            prospectiveUsers.forEach { email ->
                val contribution = scheduledPaymentViewModel.getContribution(email) ?: return@forEach
                item(email) {
                    val currency = contribution.contributionValue?.toCurrency() ?: 100.toCurrency()
                    var fieldValue by remember { mutableStateOf(currency.replace("$", "")) }
                    var isError by remember { mutableStateOf(false) }
                    val focusRequester = remember { FocusRequester() }
                    UserInviteCard(
                        email = email,
                        subtitle = scheduledPaymentViewModel.getShortDescription(),
                        onClick = { focusRequester.requestFocus() }
                    ) {
                        CurrencyTextField(
                            value = fieldValue,
                            isError = isError,
                            focusRequester = focusRequester,
                            onValueChanged = {
                                val value = it
                                    .replace(",", "")
                                    .replace("-", "")
                                    .trim()
                                isError = !value.isValidCurrencyRepresentation()
                                if (isError) {
                                    scheduledPaymentViewModel.setError(email, error)
                                    fieldValue = value
                                    Toast.makeText(context, error.message, Toast.LENGTH_SHORT).show()
                                } else {
                                    scheduledPaymentViewModel.setContribution(
                                        email,
                                        Contribution(ExpenseContributionType.FIXED, value.toCurrencyRepresentation())
                                    )
                                    fieldValue = value
                                }
                            }
                        )
                    }
                }
            }

            item("submit_button") {
                LargeSubmitButton(onDone = onDone)
            }
        }
    }
}

@Composable private fun LargeSubmitButton(
    onDone: () -> Unit,
    scheduledPaymentViewModel: ScheduledPaymentViewModel = hiltViewModel()
) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .padding(vertical = 12.dp)
            .fillMaxWidth()
    ) {
        Button(
            onClick = {
                val error = scheduledPaymentViewModel.findError()
                if (error != null) {
                    Toast.makeText(context, error.message, Toast.LENGTH_LONG).show()
                } else {
                    onDone()
                }
            },
            modifier = Modifier
                .frameFillWidth(50.dp)
        ) {
            Text(
                text = "Done",
                style = MaterialTheme.typography.body1.copy(fontWeight = FontWeight.Bold, color = Color.White)
            )
        }
    }
}
