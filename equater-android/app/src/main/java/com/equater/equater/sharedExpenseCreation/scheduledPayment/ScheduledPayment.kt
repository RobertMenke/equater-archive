package com.equater.equater.sharedExpenseCreation.scheduledPayment

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
import androidx.navigation.NavController
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.authentication.EmailConfirmationDialog
import com.equater.equater.authentication.PlaidTokenType
import com.equater.equater.authentication.User
import com.equater.equater.components.BottomDrawerBody
import com.equater.equater.components.FullScreenSheet
import com.equater.equater.components.MenuItem
import com.equater.equater.components.progressStepper.ProgressStepper
import com.equater.equater.components.progressStepper.ScheduledPaymentStep
import com.equater.equater.extensions.shouldShowEmailConfirmation
import com.equater.equater.linkBankAccount.SelectAccount
import com.equater.equater.navigation.Route
import com.equater.equater.searchUsers.UserSearchView
import com.equater.equater.searchUsers.UserSearchViewModel
import com.equater.equater.sharedExpenseCreation.RecurringExpenseInterval
import com.equater.equater.sharedExpenseCreation.ScheduledPaymentSheetState
import com.equater.equater.sharedExpenseCreation.ScheduledPaymentViewModel
import com.equater.equater.ui.AppIcon
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.ExperimentalSerializationApi
import retrofit2.HttpException
import timber.log.Timber
import androidx.hilt.navigation.compose.hiltViewModel as hiltViewModel1

@OptIn(ExperimentalMaterialApi::class)
@Composable
fun ScheduledPayment(
    navController: NavController,
    authenticationViewModel: AuthenticationViewModel,
    scheduledPaymentViewModel: ScheduledPaymentViewModel = hiltViewModel1()
) {
    val sheetState = rememberModalBottomSheetState(initialValue = ModalBottomSheetValue.Hidden)
    val intervalSheetState = rememberModalBottomSheetState(initialValue = ModalBottomSheetValue.Hidden)
    val authenticatedUser by authenticationViewModel.authenticatedUser.collectAsState()
    val user = authenticatedUser ?: return
    val showEmailConfirmation by scheduledPaymentViewModel.showEmailConfirmationDialog.collectAsState()

    if (showEmailConfirmation) {
        EmailConfirmationDialog(authenticationViewModel) {
            scheduledPaymentViewModel.showEmailConfirmationDialog.value = false
        }
    }

    val currentStep by scheduledPaymentViewModel.currentStep.collectAsState()
    val fullScreenSheetState by scheduledPaymentViewModel.sheetState.collectAsState()

    BackHandler(true) {
        if (fullScreenSheetState != ScheduledPaymentSheetState.Hidden) {
            scheduledPaymentViewModel.sheetState.value = ScheduledPaymentSheetState.Hidden
        } else {
            val previousStep = currentStep.getPreviousStep() as? ScheduledPaymentStep

            if (previousStep != null) {
                scheduledPaymentViewModel.currentStep.value = previousStep
            } else {
                navController.popBackStack()
            }
        }
    }

    ModalBottomSheetLayout(
        sheetContent = { ActionSheet(sheetState, scheduledPaymentViewModel) },
        sheetState = sheetState
    ) {
        ModalBottomSheetLayout(
            sheetContent = { IntervalActionSheet(intervalSheetState) },
            sheetState = intervalSheetState
        ) {
            Box {
                // Contains the prompts and preview for the next step
                ScheduledPaymentStep(navController, authenticationViewModel, user, sheetState, intervalSheetState)
                // Contains the full screen sheets that pop up and allow for selection like users, amounts, and accounts
                FullScreenSheetContent(authenticationViewModel)
            }
        }
    }
}

@OptIn(ExperimentalMaterialApi::class)
@Composable
private fun ScheduledPaymentStep(
    navController: NavController,
    authenticationViewModel: AuthenticationViewModel,
    user: User,
    sheetState: ModalBottomSheetState,
    intervalSheetState: ModalBottomSheetState,
    scheduledPaymentViewModel: ScheduledPaymentViewModel = hiltViewModel1()
) {
    val scope = rememberCoroutineScope()
    var isSubmitting by remember { mutableStateOf(false) }
    val context = LocalContext.current

    TopAppBar(
        navigationIcon = {
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
            }
        },
        title = { Text(text = "New Scheduled Payment") },
        backgroundColor = Color.Transparent,
        elevation = 0.dp
    )

    val currentStep by scheduledPaymentViewModel.currentStep.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(top = 50.dp)
    ) {
        ProgressStepper(currentStep = currentStep, onItemTapped = {
            val nextStep = it as? ScheduledPaymentStep
            if (nextStep != null && nextStep.isBefore(currentStep)) {
                scheduledPaymentViewModel.currentStep.value = nextStep
            }
        })

        ScheduledPaymentPreview(sheetState = sheetState)

        when (currentStep) {
            ScheduledPaymentStep.SelectFrequency ->
                SelectFrequencyPrompt(intervalSheetState = intervalSheetState, onSelected = {
                    scheduledPaymentViewModel.currentStep.value = ScheduledPaymentStep.SelectStartDate
                })
            ScheduledPaymentStep.SelectStartDate -> SelectStartDatePrompt(onSelected = {
                scheduledPaymentViewModel.currentStep.value = ScheduledPaymentStep.SelectEndDate
            })
            ScheduledPaymentStep.SelectEndDate -> SelectEndDatePrompt(onSelected = {
                scheduledPaymentViewModel.currentStep.value = ScheduledPaymentStep.SelectUsers
            })
            ScheduledPaymentStep.SelectUsers, ScheduledPaymentStep.SelectAmounts -> SelectUsersPrompt {
                scheduledPaymentViewModel.sheetState.value = ScheduledPaymentSheetState.FriendsSheetShowing
            }
            ScheduledPaymentStep.SelectAccount -> SelectDepositoryAccountPrompt {
                scheduledPaymentViewModel.sheetState.value = ScheduledPaymentSheetState.DepositorySheetShowing
            }
            ScheduledPaymentStep.Review -> ScheduledPaymentReviewPrompt(isSubmitting) {
                scope.launch {
                    isSubmitting = true
                    try {
                        scheduledPaymentViewModel.createScheduledPaymentAsync(user).await()
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
                        scheduledPaymentViewModel.showEmailConfirmationDialog.value = e.shouldShowEmailConfirmation()
                        if (!scheduledPaymentViewModel.showEmailConfirmationDialog.value) {
                            Timber.e(e)
                            Toast.makeText(
                                context,
                                "Unable to create scheduled payment. Try again or call support.",
                                Toast.LENGTH_LONG
                            ).show()
                        }
                    } catch (e: Throwable) {
                        Timber.e(e)
                        Toast.makeText(
                            context,
                            "Unable to create scheduled payment. Try again or call support.",
                            Toast.LENGTH_LONG
                        ).show()
                    }

                    isSubmitting = false
                }
            }
        }
    }
}

@OptIn(ExperimentalSerializationApi::class)
@Composable
private fun FullScreenSheetContent(
    authenticationViewModel: AuthenticationViewModel,
    scheduledPaymentViewModel: ScheduledPaymentViewModel = hiltViewModel1(),
    userSearchViewModel: UserSearchViewModel = hiltViewModel1()
) {
    val fullScreenSheetState by scheduledPaymentViewModel.sheetState.collectAsState()

    FullScreenSheet(
        isShowing = fullScreenSheetState != ScheduledPaymentSheetState.Hidden,
        content = {
            when (fullScreenSheetState) {
                ScheduledPaymentSheetState.Hidden -> {}
                ScheduledPaymentSheetState.FriendsSheetShowing, ScheduledPaymentSheetState.AmountsSheetShowing -> {
                    AnimatedVisibility(
                        visible = fullScreenSheetState == ScheduledPaymentSheetState.FriendsSheetShowing,
                        exit = slideOutHorizontally(
                            animationSpec = tween(durationMillis = 300, easing = FastOutSlowInEasing),
                            targetOffsetX = { -it }
                        )
                    ) {
                        UserSearchView(onDone = { backSelected ->
                            if (!backSelected) {
                                scheduledPaymentViewModel.addUsers(userSearchViewModel.selectedUsers.value)
                                scheduledPaymentViewModel.addInvites(userSearchViewModel.selectedEmails.value)
                            }

                            scheduledPaymentViewModel.currentStep.value =
                                if (scheduledPaymentViewModel.hasSelectedPayers() && !backSelected) {
                                    ScheduledPaymentStep.SelectAmounts
                                } else {
                                    ScheduledPaymentStep.SelectUsers
                                }

                            scheduledPaymentViewModel.sheetState.value =
                                if (scheduledPaymentViewModel.hasSelectedPayers() && !backSelected) {
                                    ScheduledPaymentSheetState.AmountsSheetShowing
                                } else {
                                    ScheduledPaymentSheetState.FriendsSheetShowing
                                }

                            // If back was not selected we animate to the next view
                            if (backSelected || !scheduledPaymentViewModel.hasSelectedPayers()) {
                                scheduledPaymentViewModel.sheetState.value = ScheduledPaymentSheetState.Hidden
                            }
                        })
                    }

                    AnimatedVisibility(
                        visible = fullScreenSheetState == ScheduledPaymentSheetState.AmountsSheetShowing,
                        enter = slideInHorizontally(
                            animationSpec = tween(durationMillis = 300, easing = FastOutSlowInEasing),
                            initialOffsetX = { it }
                        )
                    ) {
                        ScheduledPaymentAmountsView(onDone = {
                            scheduledPaymentViewModel.currentStep.value = ScheduledPaymentStep.SelectAccount
                            scheduledPaymentViewModel.sheetState.value = ScheduledPaymentSheetState.Hidden
                        })
                    }
                }
                ScheduledPaymentSheetState.DepositorySheetShowing -> {
                    val title = "Which account should we deposit your money into?"
                    SelectAccount(
                        title,
                        PlaidTokenType.AndroidDepositoryOnly,
                        null,
                        authenticationViewModel
                    ) { account ->
                        if (account == null) {
                            scheduledPaymentViewModel.sheetState.value = ScheduledPaymentSheetState.Hidden
                            return@SelectAccount
                        }

                        scheduledPaymentViewModel.depositoryAccount.value = account
                        scheduledPaymentViewModel.currentStep.value = ScheduledPaymentStep.Review
                        scheduledPaymentViewModel.sheetState.value = ScheduledPaymentSheetState.Hidden
                    }
                }
            }
        }
    )
}

@OptIn(ExperimentalMaterialApi::class)
@Composable
private fun ActionSheet(state: ModalBottomSheetState, scheduledPaymentViewModel: ScheduledPaymentViewModel) {
    val currentStep by scheduledPaymentViewModel.currentStep.collectAsState()
    val scope = rememberCoroutineScope()
    fun close() = scope.launch { state.hide() }

    BottomDrawerBody {
        MenuItem(icon = AppIcon.Create.painterResource(), text = "Edit Frequency") {
            scheduledPaymentViewModel.currentStep.value = ScheduledPaymentStep.SelectFrequency
            close()
        }

        if (currentStep.isAfter(ScheduledPaymentStep.SelectStartDate)) {
            MenuItem(icon = AppIcon.Clock.painterResource(), text = "Edit Start Date") {
                scheduledPaymentViewModel.currentStep.value = ScheduledPaymentStep.SelectStartDate
                close()
            }
        }

        if (currentStep.isAfter(ScheduledPaymentStep.SelectEndDate)) {
            MenuItem(icon = AppIcon.CardSuccess.painterResource(), text = "Edit End Date") {
                scheduledPaymentViewModel.currentStep.value = ScheduledPaymentStep.SelectEndDate
                close()
            }
        }

        if (currentStep.isAfter(ScheduledPaymentStep.SelectUsers)) {
            MenuItem(icon = AppIcon.UserProfile.painterResource(), text = "Edit Payers") {
                scheduledPaymentViewModel.currentStep.value = ScheduledPaymentStep.SelectUsers
                close()
            }
        }

        if (currentStep.isAfter(ScheduledPaymentStep.SelectAccount)) {
            MenuItem(icon = AppIcon.MoneyTransfer.painterResource(), text = "Edit Account") {
                scheduledPaymentViewModel.currentStep.value = ScheduledPaymentStep.SelectAccount
                close()
            }
        }

        MenuItem(icon = AppIcon.CancelCircle.painterResource(), text = "Close") {
            close()
        }
    }
}

@OptIn(ExperimentalMaterialApi::class)
@Composable
private fun IntervalActionSheet(
    sheetState: ModalBottomSheetState,
    viewModel: ScheduledPaymentViewModel = hiltViewModel1()
) {
    val frequency by viewModel.frequency.collectAsState()
    val scope = rememberCoroutineScope()

    BottomDrawerBody {
        MenuItem(
            icon = AppIcon.Calendar.painterResource(),
            text = RecurringExpenseInterval.Months.getDescription(frequency)
        ) {
            viewModel.recurrenceInterval.value = RecurringExpenseInterval.Months
            scope.launch { sheetState.hide() }
        }

        MenuItem(
            icon = AppIcon.Clock.painterResource(),
            text = RecurringExpenseInterval.Days.getDescription(frequency)
        ) {
            viewModel.recurrenceInterval.value = RecurringExpenseInterval.Days
            scope.launch { sheetState.hide() }
        }
    }
}
