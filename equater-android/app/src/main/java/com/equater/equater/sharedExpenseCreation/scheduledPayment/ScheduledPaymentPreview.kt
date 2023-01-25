package com.equater.equater.sharedExpenseCreation.scheduledPayment

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.MaterialTheme
import androidx.compose.material.ModalBottomSheetState
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.equater.equater.R
import com.equater.equater.components.PhotoAvatar
import com.equater.equater.components.progressStepper.ScheduledPaymentStep
import com.equater.equater.components.progressStepper.SharedBillStep
import com.equater.equater.manageAgreements.UserContribution
import com.equater.equater.manageAgreements.UserInviteContribution
import com.equater.equater.profile.LocalImage
import com.equater.equater.profile.PlaidInstitution
import com.equater.equater.sharedExpenseCreation.PreviewEdit
import com.equater.equater.sharedExpenseCreation.ScheduledPaymentViewModel
import com.equater.equater.ui.backgroundPrimary
import com.equater.equater.ui.backgroundSecondary
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterialApi::class)
@Composable
fun ScheduledPaymentPreview(
    sheetState: ModalBottomSheetState,
    modifier: Modifier = Modifier,
    scheduledPaymentViewModel: ScheduledPaymentViewModel = hiltViewModel()
) {
    val step by scheduledPaymentViewModel.currentStep.collectAsState()

    if (step == ScheduledPaymentStep.SelectFrequency) {
        return
    }

    val scope = rememberCoroutineScope()

    Column(modifier = modifier.padding(horizontal = 14.dp)) {
        Header()

        if (step.isAfter(ScheduledPaymentStep.SelectAmounts)) {
            UserContributionRow()
        }

        if (step.isAfter(ScheduledPaymentStep.SelectAccount)) {
            DepositoryAccountRow()
        }

        PreviewEdit {
            scope.launch {
                sheetState.show()
            }
        }
    }
}

@Composable
private fun Header(scheduledPaymentViewModel: ScheduledPaymentViewModel = hiltViewModel()) {
    val step by scheduledPaymentViewModel.currentStep.collectAsState()
    val context = LocalContext.current
    val clockIconPainter = remember { LocalImage(context, R.drawable.clock_icon_white_clipped) }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(100.dp)
            .padding(vertical = 0.dp)
            .clip(RoundedCornerShape(8.dp, 8.dp, 0.dp, 0.dp))
            .background(backgroundSecondary())
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
        ) {
            PhotoAvatar(
                photo = clockIconPainter,
                modifier = Modifier.padding(horizontal = 12.dp),
                background = backgroundPrimary()
            )

            Column(modifier = Modifier.padding(start = 8.dp)) {
                when (step) {
                    ScheduledPaymentStep.SelectStartDate -> {
                        Text(
                            scheduledPaymentViewModel.getShortDescription(),
                            style = MaterialTheme.typography.body1.copy(fontSize = 18.sp)
                        )
                    }
                    ScheduledPaymentStep.SelectEndDate -> {
                        Text(
                            "Starting ${scheduledPaymentViewModel.getFormattedStartDate()}",
                            style = MaterialTheme.typography.body2.copy(fontSize = 12.sp)
                        )
                        Text(
                            scheduledPaymentViewModel.getShortDescription(),
                            style = MaterialTheme.typography.body1.copy(fontSize = 18.sp)
                        )
                    }
                    else -> {
                        Text(
                            scheduledPaymentViewModel.getFrequencyDescription(),
                            style = MaterialTheme.typography.body2.copy(fontSize = 12.sp)
                        )
                        Text(
                            scheduledPaymentViewModel.getShortDescription(),
                            style = MaterialTheme.typography.body1.copy(fontSize = 18.sp)
                        )
                    }
                }
            }
        }
    }
}

@Composable private fun UserContributionRow(viewModel: ScheduledPaymentViewModel = hiltViewModel()) {
    val users = viewModel.getActiveUsers()
    val invites = viewModel.getProspectiveUsers()
    val totalContributors = users.size + invites.size + 1
    val currentStep by viewModel.currentStep.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(120.dp)
            .padding(top = 1.dp)
            .background(backgroundSecondary())
    ) {
        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
                .padding(vertical = 10.dp)
        ) {
            users.forEach { user ->
                val contribution = if (currentStep.isAfter(SharedBillStep.SelectSharingModel)) {
                    viewModel.getContribution(
                        user
                    )
                } else {
                    null
                }

                item(user.id) {
                    UserContribution(user, contribution, totalContributors, Modifier.padding(horizontal = 12.dp))
                }
            }

            invites.forEach { email ->
                val contribution = if (currentStep.isAfter(SharedBillStep.SelectSharingModel)) {
                    viewModel.getContribution(
                        email
                    )
                } else {
                    null
                }

                item(email) {
                    UserInviteContribution(
                        email,
                        contribution,
                        totalContributors,
                        Modifier.padding(horizontal = 12.dp)
                    )
                }
            }
        }
    }
}

@Composable private fun DepositoryAccountRow(scheduledPaymentViewModel: ScheduledPaymentViewModel = hiltViewModel()) {
    val depositoryAccount by scheduledPaymentViewModel.depositoryAccount.collectAsState()
    val account = depositoryAccount ?: return
    val context = LocalContext.current
    val image = remember { PlaidInstitution(context, account.institution) }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(100.dp)
            .padding(top = 1.dp)
            .background(backgroundSecondary())
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                PhotoAvatar(
                    photo = image,
                    modifier = Modifier.padding(horizontal = 12.dp),
                    background = backgroundPrimary(),
                    size = 60.dp
                )

                Text(
                    text = "Paid To",
                    style = MaterialTheme.typography.body2.copy(fontSize = 11.sp),
                    modifier = Modifier.padding(top = 2.dp)
                )
            }

            Column(modifier = Modifier.padding(start = 8.dp)) {
                Text(account.institutionName, style = MaterialTheme.typography.body1.copy(fontSize = 18.sp))
                Text(account.accountName, style = MaterialTheme.typography.body2.copy(fontSize = 12.sp))
            }
        }
    }
}
