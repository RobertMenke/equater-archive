package com.equater.equater.sharedExpenseCreation.sharedBill

import androidx.compose.runtime.Composable
import com.equater.equater.sharedExpenseCreation.BillingWizardButton

@Composable fun SelectSharingModelPrompt(onClick: () -> Unit) {
    BillingWizardButton(prompt = "How would you like to split it up?", buttonText = "Split It Up", onClick = onClick)
}
