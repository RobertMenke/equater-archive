package com.equater.equater.sharedExpenseCreation.scheduledPayment

import androidx.compose.runtime.Composable
import com.equater.equater.sharedExpenseCreation.BillingWizardButton

@Composable fun SelectDepositoryAccountPrompt(onSelected: () -> Unit) {
    BillingWizardButton(
        prompt = "Which account should we deposit your money into?",
        buttonText = "Select Account",
        onClick = onSelected
    )
}
