package com.equater.equater.sharedExpenseCreation.sharedBill

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
import com.equater.equater.authentication.User
import com.equater.equater.authentication.UserAccount
import com.equater.equater.components.PhotoAvatar
import com.equater.equater.components.progressStepper.SharedBillStep
import com.equater.equater.extensions.possessive
import com.equater.equater.manageAgreements.UserContribution
import com.equater.equater.manageAgreements.UserInviteContribution
import com.equater.equater.profile.LocalImage
import com.equater.equater.profile.VendorLogo
import com.equater.equater.searchVendors.Vendor
import com.equater.equater.sharedExpenseCreation.PreviewEdit
import com.equater.equater.sharedExpenseCreation.SharedBillSheetState
import com.equater.equater.sharedExpenseCreation.SharedBillViewModel
import com.equater.equater.ui.backgroundPrimary
import com.equater.equater.ui.backgroundSecondary
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterialApi::class)
@Composable
fun SharedBillPreview(
    authenticatedUser: User,
    sheetState: ModalBottomSheetState,
    modifier: Modifier = Modifier,
    sharedBillViewModel: SharedBillViewModel = hiltViewModel()
) {
    val step by sharedBillViewModel.currentStep.collectAsState()
    val creditAccount by sharedBillViewModel.creditAccount.collectAsState()
    val depositoryAccount by sharedBillViewModel.depositoryAccount.collectAsState()
    val account = creditAccount ?: depositoryAccount

    if (step == SharedBillStep.SelectVendor) {
        return
    }

    val maybeVendor by sharedBillViewModel.vendor.collectAsState()
    val vendor = maybeVendor ?: return
    val scope = rememberCoroutineScope()

    Column(modifier = modifier.padding(horizontal = 14.dp)) {
        Header(authenticatedUser = authenticatedUser, vendor = vendor, account = account)

        if (step.isAfter(SharedBillStep.SelectUsers)) {
            UserContributionRow(authenticatedUser)
        }

        PreviewEdit {
            when (sharedBillViewModel.currentStep.value) {
                SharedBillStep.SelectUsers -> {
                    sharedBillViewModel.currentStep.value = SharedBillStep.SelectVendor
                    sharedBillViewModel.sheetState.value = SharedBillSheetState.VendorSheetShowing
                }
                else -> scope.launch { sheetState.show() }
            }
        }
    }
}

@Composable private fun Header(authenticatedUser: User, vendor: Vendor, account: UserAccount? = null) {
    val context = LocalContext.current
    val secondaryText = account?.accountName ?: authenticatedUser.fullName()

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
            if (vendor.logoSha256Hash == null && vendor.googlePlacesId != null) {
                val pinIconPainter = remember { LocalImage(context, R.drawable.map_pin) }
                PhotoAvatar(
                    photo = pinIconPainter,
                    modifier = Modifier.padding(horizontal = 16.dp),
                    background = backgroundPrimary(),
                    size = 60.dp,
                    imageSize = 30.dp
                )
            } else {
                val image = remember { VendorLogo(context, vendor) }
                PhotoAvatar(
                    photo = image,
                    modifier = Modifier.padding(horizontal = 12.dp),
                    background = backgroundPrimary()
                )
            }

            Column(modifier = Modifier.padding(start = 8.dp)) {
                Text(secondaryText, style = MaterialTheme.typography.body2.copy(fontSize = 12.sp))
                Text(
                    "${authenticatedUser.firstName.possessive()} ${vendor.friendlyName} bill",
                    style = MaterialTheme.typography.body1.copy(fontSize = 18.sp)
                )
            }
        }
    }
}

@Composable private fun UserContributionRow(
    authenticatedUser: User,
    viewModel: SharedBillViewModel = hiltViewModel()
) {
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
            val authenticatedUserContribution = if (currentStep.isAfter(SharedBillStep.SelectSharingModel)) {
                viewModel.getExpenseOwnerContribution()
            } else {
                null
            }

            item(authenticatedUser.id) {
                UserContribution(
                    authenticatedUser,
                    authenticatedUserContribution,
                    totalContributors,
                    Modifier.padding(horizontal = 12.dp)
                )
            }

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
                    UserInviteContribution(email, contribution, totalContributors, Modifier.padding(horizontal = 12.dp))
                }
            }
        }
    }
}
