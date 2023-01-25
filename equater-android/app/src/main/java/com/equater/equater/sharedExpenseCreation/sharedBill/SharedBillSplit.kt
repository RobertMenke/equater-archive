package com.equater.equater.sharedExpenseCreation.sharedBill

import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.Button
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Tab
import androidx.compose.material.TabRow
import androidx.compose.material.Text
import androidx.compose.material.TextButton
import androidx.compose.runtime.Composable
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
import com.equater.equater.authentication.User
import com.equater.equater.components.CurrencyTextField
import com.equater.equater.components.Fraction
import com.equater.equater.components.PlainTextField
import com.equater.equater.extensions.isInt
import com.equater.equater.extensions.isValidCurrencyRepresentation
import com.equater.equater.extensions.toCurrency
import com.equater.equater.extensions.toCurrencyRepresentation
import com.equater.equater.searchUsers.UserCard
import com.equater.equater.searchUsers.UserInviteCard
import com.equater.equater.sharedExpenseCreation.Contribution
import com.equater.equater.sharedExpenseCreation.ExpenseContributionType
import com.equater.equater.sharedExpenseCreation.SharedBillViewModel
import com.equater.equater.ui.accentPrimaryForText
import com.equater.equater.ui.backgroundPrimary
import com.equater.equater.ui.frameFillWidth

private val tabTitles = listOf("Split Evenly", "Percentage", "Fixed")

@Composable
fun SharedBillSplit(
    authenticatedUser: User,
    onDone: () -> Unit,
    sharedBillViewModel: SharedBillViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    var selectedTab by remember { mutableStateOf(0) }

    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp, horizontal = 14.dp)
                .height(52.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = "Split It Up", style = MaterialTheme.typography.h4)
            TextButton(onClick = {
                val error = sharedBillViewModel.findError()
                if (error != null) {
                    Toast.makeText(context, error.message, Toast.LENGTH_LONG).show()
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

        TabRow(selectedTabIndex = selectedTab, backgroundColor = backgroundPrimary()) {
            tabTitles.forEachIndexed { index, title ->
                Tab(
                    text = { Text(title) },
                    selected = selectedTab == index,
                    onClick = {
                        when (index) {
                            0 -> sharedBillViewModel.setSplitEvenlyContributions()
                            1 -> sharedBillViewModel.setPercentageContributions()
                            2 -> sharedBillViewModel.setFixedContributions()
                        }
                        selectedTab = index
                    }
                )
            }
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(vertical = 8.dp, horizontal = 14.dp)
        ) {
            when (selectedTab) {
                0 -> SplitEvenlyColumn(authenticatedUser, onDone)
                1 -> SplitPercentageColumn(authenticatedUser, onDone)
                2 -> SplitFixedColumn(authenticatedUser, onDone)
            }
        }
    }
}

@Composable private fun SplitEvenlyColumn(
    authenticatedUser: User,
    onDone: () -> Unit,
    sharedBillViewModel: SharedBillViewModel = hiltViewModel()
) {
    val activeUsers = sharedBillViewModel.getActiveUsers()
    val prospectiveUsers = sharedBillViewModel.getProspectiveUsers()
    val totalParticipants = activeUsers.size + prospectiveUsers.size + 1
    val subtitle = "Will pay ${1}/$totalParticipants of the total"

    LazyColumn {
        item(authenticatedUser.id) {
            UserCard(user = authenticatedUser, onClick = {}, title = "You", subtitle = subtitle) {
                Fraction(numerator = 1, denominator = totalParticipants)
            }
        }

        activeUsers.forEach { user ->
            item(user.id) {
                UserCard(user = user, onClick = {}, subtitle = subtitle) {
                    Fraction(numerator = 1, denominator = totalParticipants)
                }
            }
        }

        prospectiveUsers.forEach { email ->
            item(email) {
                UserInviteCard(email = email, onClick = {}, subtitle = subtitle) {
                    Fraction(numerator = 1, denominator = totalParticipants)
                }
            }
        }

        item("submit_button") {
            LargeSubmitButton(onDone = onDone)
        }
    }
}

@Composable private fun SplitPercentageColumn(
    authenticatedUser: User,
    onDone: () -> Unit,
    sharedBillViewModel: SharedBillViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val activeUsers = sharedBillViewModel.getActiveUsers()
    val prospectiveUsers = sharedBillViewModel.getProspectiveUsers()
    val error = Error("% must be a whole number between 0 and 100")
    var remainingPercentage by remember { mutableStateOf(sharedBillViewModel.getRemainingPercentageContribution()) }

    LazyColumn {
        item(authenticatedUser.id) {
            UserCard(
                user = authenticatedUser,
                onClick = {},
                title = "You",
                subtitle = "Pays $remainingPercentage% of the total"
            ) {
                Text(
                    text = "$remainingPercentage%",
                    style = MaterialTheme.typography.body1.copy(fontWeight = FontWeight.Bold)
                )
            }
        }

        activeUsers.forEach { user ->
            val contribution = sharedBillViewModel.getContribution(user) ?: return@forEach
            item(user.id) {
                var fieldValue by remember { mutableStateOf("${contribution.contributionValue ?: 0}") }
                var isError by remember { mutableStateOf(false) }
                val focusRequester = remember { FocusRequester() }
                UserCard(
                    user = user,
                    onClick = { focusRequester.requestFocus() },
                    subtitle = "Pays $fieldValue% of the total"
                ) {
                    PercentageTextField(
                        value = fieldValue,
                        isError = isError,
                        focusRequester = focusRequester,
                        onValueChanged = {
                            val value = it
                                .replace(".", "")
                                .replace(",", "")
                                .replace("-", "")
                                .trim()
                            isError = !value.isInt() || value.toInt() > 100
                            if (isError) {
                                sharedBillViewModel.setError(user, error)
                                fieldValue = value
                                Toast.makeText(context, error.message, Toast.LENGTH_SHORT).show()
                            } else {
                                sharedBillViewModel.setContribution(
                                    user,
                                    Contribution(ExpenseContributionType.PERCENTAGE, value.toInt())
                                )
                                fieldValue = value
                                remainingPercentage = sharedBillViewModel.getRemainingPercentageContribution()
                            }
                        }
                    )
                }
            }
        }

        prospectiveUsers.forEach { email ->
            val contribution = sharedBillViewModel.getContribution(email) ?: return@forEach
            item(email) {
                var fieldValue by remember { mutableStateOf("${contribution.contributionValue}") }
                var isError by remember { mutableStateOf(false) }
                val focusRequester = remember { FocusRequester() }
                UserInviteCard(
                    email = email,
                    onClick = { focusRequester.requestFocus() },
                    subtitle = "Pays $fieldValue% of the total"
                ) {
                    PercentageTextField(
                        value = fieldValue,
                        isError = isError,
                        focusRequester = focusRequester,
                        onValueChanged = {
                            val value = it
                                .replace(".", "")
                                .replace(",", "")
                                .replace("-", "")
                                .trim()
                            isError = !value.isInt() || value.toInt() > 100
                            if (isError) {
                                sharedBillViewModel.setError(email, error)
                                fieldValue = value
                                Toast.makeText(context, error.message, Toast.LENGTH_SHORT).show()
                            } else {
                                sharedBillViewModel.setContribution(
                                    email,
                                    Contribution(ExpenseContributionType.PERCENTAGE, value.toInt())
                                )
                                fieldValue = value
                                remainingPercentage = sharedBillViewModel.getRemainingPercentageContribution()
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

@Composable private fun SplitFixedColumn(
    authenticatedUser: User,
    onDone: () -> Unit,
    sharedBillViewModel: SharedBillViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val activeUsers = sharedBillViewModel.getActiveUsers()
    val prospectiveUsers = sharedBillViewModel.getProspectiveUsers()
    val error = Error("Must enter a valid dollar amount")

    fun getSubtitle(value: String): String {
        if (value.isValidCurrencyRepresentation()) {
            return "Pays ${value.toCurrency()}"
        }

        return "Pays ??"
    }

    LazyColumn {
        item(authenticatedUser.id) {
            UserCard(
                user = authenticatedUser,
                onClick = {},
                title = "You",
                subtitle = "Pay the remainder of the bill"
            ) {
                Text(text = "Remainder", style = MaterialTheme.typography.body1.copy(fontWeight = FontWeight.Bold))
            }
        }

        activeUsers.forEach { user ->
            val contribution = sharedBillViewModel.getContribution(user) ?: return@forEach
            item(user.id) {
                val currency = contribution.contributionValue?.toCurrency() ?: 500.toCurrency()
                var fieldValue by remember { mutableStateOf(currency.replace("$", "")) }
                var isError by remember { mutableStateOf(false) }
                val focusRequester = remember { FocusRequester() }
                UserCard(
                    user = user,
                    onClick = { focusRequester.requestFocus() },
                    subtitle = getSubtitle(fieldValue)
                ) {
                    CurrencyTextField(
                        value = fieldValue,
                        isError = isError,
                        focusRequester = focusRequester,
                        onValueChanged = {
                            val value = it.replace(",", "").replace("-", "").trim()
                            isError = !value.isValidCurrencyRepresentation()
                            if (isError) {
                                sharedBillViewModel.setError(user, error)
                                fieldValue = value
                                Toast.makeText(context, error.message, Toast.LENGTH_SHORT).show()
                            } else {
                                sharedBillViewModel.setContribution(
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
            val contribution = sharedBillViewModel.getContribution(email) ?: return@forEach
            item(email) {
                val currency = contribution.contributionValue?.toCurrency() ?: 500.toCurrency()
                var fieldValue by remember { mutableStateOf(currency.replace("$", "")) }
                var isError by remember { mutableStateOf(false) }
                val focusRequester = remember { FocusRequester() }
                UserInviteCard(
                    email = email,
                    onClick = { focusRequester.requestFocus() },
                    subtitle = getSubtitle(fieldValue)
                ) {
                    CurrencyTextField(
                        value = fieldValue,
                        isError = isError,
                        focusRequester = focusRequester,
                        onValueChanged = {
                            val value = it.replace(",", "").replace("-", "").trim()
                            isError = !value.isValidCurrencyRepresentation()
                            if (isError) {
                                sharedBillViewModel.setError(email, error)
                                fieldValue = value
                                Toast.makeText(context, error.message, Toast.LENGTH_SHORT).show()
                            } else {
                                sharedBillViewModel.setContribution(
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

@Composable fun PercentageTextField(
    value: String,
    onValueChanged: (String) -> Unit,
    isError: Boolean,
    focusRequester: FocusRequester? = null
) {
    Row(
        modifier = Modifier
            .fillMaxHeight()
            .width(76.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        PlainTextField(
            width = 66.dp,
            value = value,
            onValueChanged = onValueChanged,
            isError = isError,
            focusRequester = focusRequester
        )
        Text(text = "%", style = MaterialTheme.typography.body1, modifier = Modifier.padding(start = 2.dp))
    }
}

@Composable private fun LargeSubmitButton(
    onDone: () -> Unit,
    sharedBillViewModel: SharedBillViewModel = hiltViewModel()
) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .padding(vertical = 12.dp)
            .fillMaxWidth()
    ) {
        Button(
            onClick = {
                val error = sharedBillViewModel.findError()
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
