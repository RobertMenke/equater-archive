package com.equater.equater.sharedExpenseCreation.sharedBill

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import com.equater.equater.sharedExpenseCreation.BillingWizardButton
import com.equater.equater.sharedExpenseCreation.SharedBillViewModel

@Composable fun SelectUsersPrompt(onClick: () -> Unit, sharedBillViewModel: SharedBillViewModel = hiltViewModel()) {
    val maybeVendor by sharedBillViewModel.vendor.collectAsState()
    val vendor = maybeVendor ?: return

    BillingWizardButton(
        prompt = "Who are you splitting ${vendor.friendlyName} with?",
        buttonText = "Find Your Friends",
        onClick = onClick
    )
}
