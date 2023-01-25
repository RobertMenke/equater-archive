package com.equater.equater.sharedExpenseCreation.sharedBill

import androidx.compose.runtime.Composable
import com.equater.equater.sharedExpenseCreation.BillingWizardButton

@Composable
fun ReviewPrompt(isLoading: Boolean, onClick: () -> Unit) {
    BillingWizardButton(
        prompt = "When you get charged, we'll automatically split up the bill!",
        buttonText = "Great! Let's Do It.",
        onClick = onClick,
        isLoading = isLoading
    )
}
