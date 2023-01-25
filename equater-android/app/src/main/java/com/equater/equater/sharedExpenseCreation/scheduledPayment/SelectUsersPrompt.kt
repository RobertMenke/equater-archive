package com.equater.equater.sharedExpenseCreation.scheduledPayment

import androidx.compose.runtime.Composable
import com.equater.equater.sharedExpenseCreation.BillingWizardButton

@Composable fun SelectUsersPrompt(onSelected: () -> Unit) {
    BillingWizardButton(
        prompt = "Who are you charging?",
        buttonText = "Find Your Payers",
        onClick = onSelected
    )
}
