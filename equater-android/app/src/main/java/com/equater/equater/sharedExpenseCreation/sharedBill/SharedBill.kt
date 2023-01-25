package com.equater.equater.sharedExpenseCreation.sharedBill

import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.Icon
import androidx.compose.material.IconButton
import androidx.compose.material.ModalBottomSheetLayout
import androidx.compose.material.ModalBottomSheetState
import androidx.compose.material.ModalBottomSheetValue
import androidx.compose.material.Text
import androidx.compose.material.TopAppBar
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.equater.equater.R
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.authentication.EmailConfirmationDialog
import com.equater.equater.authentication.PlaidTokenType
import com.equater.equater.authentication.User
import com.equater.equater.components.BottomDrawerBody
import com.equater.equater.components.FullScreenSheet
import com.equater.equater.components.MenuItem
import com.equater.equater.components.progressStepper.ProgressStepper
import com.equater.equater.components.progressStepper.SharedBillStep
import com.equater.equater.extensions.shouldShowEmailConfirmation
import com.equater.equater.linkBankAccount.SelectAccount
import com.equater.equater.navigation.Route
import com.equater.equater.searchUsers.UserSearchView
import com.equater.equater.searchUsers.UserSearchViewModel
import com.equater.equater.searchVendors.VendorSearchView
import com.equater.equater.sharedExpenseCreation.SharedBillSheetState
import com.equater.equater.sharedExpenseCreation.SharedBillViewModel
import com.equater.equater.ui.AppIcon
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.ExperimentalSerializationApi
import retrofit2.HttpException
import timber.log.Timber

@OptIn(ExperimentalMaterialApi::class)
@Composable
fun SharedBill(
    navController: NavController,
    authenticationViewModel: AuthenticationViewModel,
    sharedBillViewModel: SharedBillViewModel = hiltViewModel()
) {
    val authenticatedUser by authenticationViewModel.authenticatedUser.collectAsState()
    val user = authenticatedUser ?: return
    val sheetState = rememberModalBottomSheetState(initialValue = ModalBottomSheetValue.Hidden)
    val showEmailConfirmation by sharedBillViewModel.showEmailConfirmationDialog.collectAsState()

    if (showEmailConfirmation) {
        EmailConfirmationDialog(authenticationViewModel) {
            sharedBillViewModel.showEmailConfirmationDialog.value = false
        }
    }

    val currentStep by sharedBillViewModel.currentStep.collectAsState()
    val fullScreenSheetState by sharedBillViewModel.sheetState.collectAsState()

    BackHandler(true) {
        if (fullScreenSheetState != SharedBillSheetState.Hidden) {
            sharedBillViewModel.sheetState.value = SharedBillSheetState.Hidden
        } else {
            val previousStep = currentStep.getPreviousStep() as? SharedBillStep

            if (previousStep != null) {
                sharedBillViewModel.currentStep.value = previousStep
            } else {
                navController.popBackStack()
            }
        }
    }

    ModalBottomSheetLayout(
        sheetContent = { ActionSheet(sheetState, sharedBillViewModel) },
        sheetState = sheetState
    ) {
        Box {
            // Contains the prompts and preview for the next step
            SharedBillWizardStep(navController, authenticationViewModel, user, sheetState)
            // Contains the full screen sheets that pop up and allow for selection like vendor, user, split, account
            FullScreenSheetContent(user, authenticationViewModel)
        }
    }
}

@OptIn(ExperimentalMaterialApi::class)
@Composable
fun SharedBillWizardStep(
    navController: NavController,
    authenticationViewModel: AuthenticationViewModel,
    user: User,
    sheetState: ModalBottomSheetState,
    sharedBillViewModel: SharedBillViewModel = hiltViewModel()
) {
    val scope = rememberCoroutineScope()
    val currentStep by sharedBillViewModel.currentStep.collectAsState()
    var isSubmitting by remember { mutableStateOf(false) }
    val context = LocalContext.current
    // Maintaining a separate top app bar here so that we can easily cover the full screen with pop up content
    TopAppBar(
        navigationIcon = {
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
            }
        },
        title = { Text(text = "New Shared Bill") },
        backgroundColor = Color.Transparent,
        elevation = 0.dp
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(top = 50.dp)
    ) {
        ProgressStepper(currentStep = currentStep, onItemTapped = {
            val nextStep = it as? SharedBillStep
            if (nextStep != null && nextStep.isBefore(currentStep)) {
                sharedBillViewModel.currentStep.value = nextStep
            }
        })

        SharedBillPreview(
            authenticatedUser = user,
            sheetState = sheetState,
            modifier = Modifier.padding(vertical = 8.dp)
        )

        when (currentStep) {
            SharedBillStep.SelectVendor -> SelectVendorPrompt() {
                sharedBillViewModel.sheetState.value = SharedBillSheetState.VendorSheetShowing
            }
            SharedBillStep.SelectUsers -> SelectUsersPrompt(onClick = {
                sharedBillViewModel.sheetState.value = SharedBillSheetState.FriendsSheetShowing
            })
            SharedBillStep.SelectSharingModel -> SelectSharingModelPrompt {
                sharedBillViewModel.sheetState.value = SharedBillSheetState.SharingModelSheetShowing
            }
            SharedBillStep.SelectAccount -> SelectAccountPrompt(onClick = {
                sharedBillViewModel.sheetState.value = SharedBillSheetState.AccountSheetShowing
            })
            SharedBillStep.Review -> ReviewPrompt(isSubmitting) {
                scope.launch {
                    isSubmitting = true
                    try {
                        sharedBillViewModel.createSharedBillAsync(user).await()
                        Toast.makeText(
                            context,
                            "Success! Your agreement will become active when all participants accept.",
                            Toast.LENGTH_LONG
                        ).show()
                        // Sync relationships after new shared bill because this request can establish new relationships
                        authenticationViewModel.syncRelationships(user.id)
                        withContext(Dispatchers.Main) {
                            navController.navigate("agreements?tab=1") {
                                popUpTo(Route.SplashScreen.route)
                            }
                        }
                    } catch (e: HttpException) {
                        sharedBillViewModel.showEmailConfirmationDialog.value = e.shouldShowEmailConfirmation()
                        if (!sharedBillViewModel.showEmailConfirmationDialog.value) {
                            Timber.e(e)
                            Toast.makeText(
                                context,
                                "Unable to create shared bill. Try again or call support.",
                                Toast.LENGTH_LONG
                            ).show()
                        }
                    } catch (e: Throwable) {
                        Timber.e(e)
                        Toast.makeText(
                            context,
                            "Unable to create shared bill. Try again or call support.",
                            Toast.LENGTH_LONG
                        ).show()
                    }

                    isSubmitting = false
                }
            }
        }
    }

    // Users are allowed to go back to make edits. Use this block to undo any state.
    LaunchedEffect(currentStep) {
        if (currentStep != SharedBillStep.Review) {
            sharedBillViewModel.creditAccount.value = null
            sharedBillViewModel.depositoryAccount.value = null
        }
    }
}

@OptIn(ExperimentalSerializationApi::class)
@Composable
private fun FullScreenSheetContent(
    user: User,
    authenticationViewModel: AuthenticationViewModel,
    sharedBillViewModel: SharedBillViewModel = hiltViewModel(),
    userSearchViewModel: UserSearchViewModel = hiltViewModel()
) {
    val fullScreenSheetState by sharedBillViewModel.sheetState.collectAsState()
    val vendor by sharedBillViewModel.vendor.collectAsState()
    val context = LocalContext.current

    fun makeTitle(): String {
        // This should never happen
        val merchant = vendor ?: return "Which account would you like to use?"

        return when (fullScreenSheetState) {
            SharedBillSheetState.DepositorySheetShowing -> "Credit card detected"
            else -> "Which account do you use to pay for ${merchant.friendlyName}?"
        }
    }

    fun makeSubtitle(): String? {
        val merchant = vendor ?: return null

        if (fullScreenSheetState != SharedBillSheetState.DepositorySheetShowing) {
            return null
        }

        return context.getString(R.string.depository_account_explanation, merchant.friendlyName)
    }

    FullScreenSheet(
        isShowing = fullScreenSheetState != SharedBillSheetState.Hidden,
        content = {
            when (fullScreenSheetState) {
                SharedBillSheetState.Hidden -> {}
                SharedBillSheetState.VendorSheetShowing -> VendorSearchView(onSelected = { vendor ->
                    sharedBillViewModel.vendor.value = vendor
                    sharedBillViewModel.currentStep.value = if (vendor != null) {
                        SharedBillStep.SelectUsers
                    } else {
                        SharedBillStep.SelectVendor
                    }
                    sharedBillViewModel.sheetState.value = SharedBillSheetState.Hidden
                })
                SharedBillSheetState.FriendsSheetShowing -> UserSearchView(onDone = { backSelected ->
                    if (!backSelected) {
                        sharedBillViewModel.addUsers(userSearchViewModel.selectedUsers.value)
                        sharedBillViewModel.addInvites(userSearchViewModel.selectedEmails.value)
                    }

                    val shouldSelectSharingModel = sharedBillViewModel.hasSelectedPayers() && !backSelected

                    sharedBillViewModel.currentStep.value = if (shouldSelectSharingModel) {
                        SharedBillStep.SelectSharingModel
                    } else {
                        SharedBillStep.SelectUsers
                    }

                    sharedBillViewModel.sheetState.value = SharedBillSheetState.Hidden
                })
                SharedBillSheetState.SharingModelSheetShowing -> SharedBillSplit(user, onDone = {
                    sharedBillViewModel.currentStep.value = SharedBillStep.SelectAccount
                    sharedBillViewModel.sheetState.value = SharedBillSheetState.Hidden
                })
                SharedBillSheetState.AccountSheetShowing, SharedBillSheetState.DepositorySheetShowing -> {
                    val tokenType = if (fullScreenSheetState == SharedBillSheetState.AccountSheetShowing) {
                        PlaidTokenType.AndroidCreditAndDepository
                    } else {
                        PlaidTokenType.AndroidDepositoryOnly
                    }

                    AnimatedVisibility(
                        visible = fullScreenSheetState == SharedBillSheetState.AccountSheetShowing,
                        exit = slideOutHorizontally(
                            animationSpec = tween(durationMillis = 300, easing = FastOutSlowInEasing),
                            targetOffsetX = { -it }
                        )
                    ) {
                        // Use remember here to prevent the first SelectAccount from re-rendering immediately when the state changes
                        val title by remember { mutableStateOf(makeTitle()) }
                        val subtitle by remember { mutableStateOf(makeSubtitle()) }
                        val token by remember { mutableStateOf(tokenType) }
                        SelectAccount(title, token, subtitle, authenticationViewModel) { account ->
                            if (account == null) {
                                sharedBillViewModel.sheetState.value = SharedBillSheetState.Hidden
                                return@SelectAccount
                            }

                            // If we selected a credit account, we also need to select a depository account
                            if (account.accountType != "depository") {
                                sharedBillViewModel.creditAccount.value = account
                                sharedBillViewModel.sheetState.value = SharedBillSheetState.DepositorySheetShowing
                            } else {
                                sharedBillViewModel.depositoryAccount.value = account
                                sharedBillViewModel.currentStep.value = SharedBillStep.Review
                                sharedBillViewModel.sheetState.value = SharedBillSheetState.Hidden
                            }
                        }
                    }

                    AnimatedVisibility(
                        visible = fullScreenSheetState == SharedBillSheetState.DepositorySheetShowing,
                        enter = slideInHorizontally(
                            animationSpec = tween(durationMillis = 300, easing = FastOutSlowInEasing),
                            initialOffsetX = { it }
                        )
                    ) {
                        SelectAccount(makeTitle(), tokenType, makeSubtitle(), authenticationViewModel) { account ->
                            if (account == null) {
                                sharedBillViewModel.sheetState.value = SharedBillSheetState.Hidden
                                return@SelectAccount
                            }

                            sharedBillViewModel.depositoryAccount.value = account
                            sharedBillViewModel.currentStep.value = SharedBillStep.Review
                            sharedBillViewModel.sheetState.value = SharedBillSheetState.Hidden
                        }
                    }
                }
            }
        }
    )
}

@OptIn(ExperimentalMaterialApi::class)
@Composable
private fun ActionSheet(state: ModalBottomSheetState, sharedBillViewModel: SharedBillViewModel) {
    val currentStep by sharedBillViewModel.currentStep.collectAsState()
    val scope = rememberCoroutineScope()

    BottomDrawerBody {
        MenuItem(icon = AppIcon.ShoppingBag.painterResource(), text = "Edit Biller") {
            sharedBillViewModel.currentStep.value = SharedBillStep.SelectVendor
            sharedBillViewModel.sheetState.value = SharedBillSheetState.VendorSheetShowing

            scope.launch {
                state.hide()
            }
        }

        MenuItem(icon = AppIcon.UserProfile.painterResource(), text = "Edit Payers") {
            scope.launch {
                sharedBillViewModel.currentStep.value = SharedBillStep.SelectUsers
                sharedBillViewModel.sheetState.value = SharedBillSheetState.FriendsSheetShowing
                state.hide()
            }
        }

        if (currentStep.isAfter(SharedBillStep.SelectSharingModel)) {
            MenuItem(icon = AppIcon.WalletIcon.painterResource(), text = "Edit Amounts") {
                scope.launch {
                    sharedBillViewModel.currentStep.value = SharedBillStep.SelectSharingModel
                    sharedBillViewModel.sheetState.value = SharedBillSheetState.SharingModelSheetShowing
                    state.hide()
                }
            }
        }

        if (currentStep == SharedBillStep.Review) {
            MenuItem(icon = AppIcon.MoneyTransfer.painterResource(), text = "Edit Account") {
                scope.launch {
                    sharedBillViewModel.currentStep.value = SharedBillStep.SelectAccount
                    sharedBillViewModel.sheetState.value = SharedBillSheetState.AccountSheetShowing
                    state.hide()
                }
            }
        }

        MenuItem(icon = AppIcon.CancelCircle.painterResource(), text = "Close") {
            scope.launch { state.hide() }
        }
    }
}
