package com.equater.equater.sharedExpenseCreation.sharedBill

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import com.equater.equater.sharedExpenseCreation.BillingWizardButton
import com.equater.equater.sharedExpenseCreation.SharedBillViewModel

@Composable
fun SelectAccountPrompt(onClick: () -> Unit, sharedBillViewModel: SharedBillViewModel = hiltViewModel()) {
    val maybeVendor by sharedBillViewModel.vendor.collectAsState()
    val vendor = maybeVendor ?: return

    BillingWizardButton(
        prompt = "Which account do you use to pay for ${vendor.friendlyName}?",
        buttonText = "Select Account",
        onClick = onClick
    )
}
