package com.equater.equater.sharedExpenseCreation.scheduledPayment

import androidx.compose.runtime.Composable
import com.equater.equater.sharedExpenseCreation.BillingWizardButton

@Composable fun ScheduledPaymentReviewPrompt(isLoading: Boolean, onSubmitRequested: () -> Unit) {
    BillingWizardButton(
        prompt = "Review your agreement",
        buttonText = "Create Agreement",
        onClick = onSubmitRequested,
        isLoading = isLoading
    )
}
