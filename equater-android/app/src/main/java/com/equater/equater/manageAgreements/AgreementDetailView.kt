package com.equater.equater.manageAgreements

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Button
import androidx.compose.material.ButtonDefaults
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.Icon
import androidx.compose.material.MaterialTheme
import androidx.compose.material.ModalBottomSheetLayout
import androidx.compose.material.ModalBottomSheetState
import androidx.compose.material.ModalBottomSheetValue
import androidx.compose.material.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.equater.equater.R
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.authentication.EmailConfirmationDialog
import com.equater.equater.authentication.User
import com.equater.equater.components.BottomDrawerBody
import com.equater.equater.components.LoadingColumn
import com.equater.equater.components.MenuItem
import com.equater.equater.components.PhotoAvatar
import com.equater.equater.components.SlideToConfirm
import com.equater.equater.components.SlideToConfirmResult
import com.equater.equater.extensions.shouldShowEmailConfirmation
import com.equater.equater.sharedExpenseCreation.AgreementStatus
import com.equater.equater.sharedExpenseCreation.SharedExpenseStory
import com.equater.equater.sharedExpenseCreation.SharedExpenseUserAgreement
import com.equater.equater.sharedExpenseCreation.findAgreement
import com.equater.equater.sharedExpenseCreation.getAgreementStatus
import com.equater.equater.sharedExpenseCreation.getFrequencyText
import com.equater.equater.sharedExpenseCreation.getNextPaymentDateText
import com.equater.equater.sharedExpenseCreation.getStatusDisplay
import com.equater.equater.sharedExpenseCreation.rememberAgreementImage
import com.equater.equater.ui.backgroundSecondary
import com.equater.equater.ui.greenAccept
import com.equater.equater.ui.redDecline
import kotlinx.coroutines.launch
import retrofit2.HttpException
import timber.log.Timber

@Composable
fun AgreementDetailViewFromDeepLink(
    navController: NavController,
    authenticationViewModel: AuthenticationViewModel,
    agreementViewModel: AgreementViewModel,
    sharedExpenseId: Int
) {
    val agreements by agreementViewModel.agreements.collectAsState()
    val hasAgreements by derivedStateOf { agreements.isNotEmpty() }
    var sharedExpense by remember { mutableStateOf<SharedExpenseStory?>(null) }
    val story = sharedExpense

    LaunchedEffect(hasAgreements) {
        if (hasAgreements) {
            sharedExpense = agreementViewModel.agreements.value.firstOrNull { it.sharedExpense.id == sharedExpenseId }
        }
    }

    if (story != null) {
        AgreementDetailView(navController, authenticationViewModel, agreementViewModel, story)
    } else {
        LoadingColumn(height = 150.dp)
    }
}

@OptIn(ExperimentalMaterialApi::class)
@Composable
fun AgreementDetailView(
    navController: NavController,
    authenticationViewModel: AuthenticationViewModel,
    agreementViewModel: AgreementViewModel,
    sharedExpense: SharedExpenseStory
) {
    val (story, setStory) = remember { mutableStateOf(sharedExpense) }
    val sheetState = rememberModalBottomSheetState(initialValue = ModalBottomSheetValue.Hidden)
    val authenticatedUser by authenticationViewModel.authenticatedUser.collectAsState()
    val user = authenticatedUser ?: return

    val showEmailConfirmation by agreementViewModel.showEmailConfirmation.collectAsState()

    if (showEmailConfirmation) {
        EmailConfirmationDialog(authenticationViewModel) {
            agreementViewModel.showEmailConfirmation.value = false
        }
    }

    @Composable fun BottomSheet() {
        ActionSheet(
            user,
            navController,
            story,
            sheetState,
            agreementViewModel,
            setStory
        )
    }

    ModalBottomSheetLayout(sheetContent = { BottomSheet() }, sheetState = sheetState) {
        BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
            val height = maxHeight

            Column(modifier = Modifier.fillMaxSize()) {
                Header(story = story, height = height)
                Body(
                    agreementViewModel = agreementViewModel,
                    story = story,
                    setStory = setStory,
                    user = user,
                    sheetState = sheetState
                )
            }
        }
    }
}

@Composable private fun Header(story: SharedExpenseStory, height: Dp) {
    val context = LocalContext.current
    val headerHeight = height.times(0.3f)
    val image = story.rememberAgreementImage(context)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .height(headerHeight),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        PhotoAvatar(photo = image, modifier = Modifier.padding(bottom = 8.dp))

        if (story.vendor != null) {
            Text(text = story.sharedExpense.expenseNickName, style = MaterialTheme.typography.body1)
        } else {
            Text(text = story.getFrequencyText(), style = MaterialTheme.typography.body1)
            Text(text = story.getNextPaymentDateText(), style = MaterialTheme.typography.body2)
        }
    }
}

@OptIn(ExperimentalMaterialApi::class)
@Composable
private fun Body(
    agreementViewModel: AgreementViewModel,
    story: SharedExpenseStory,
    setStory: (SharedExpenseStory) -> Unit,
    user: User?,
    sheetState: ModalBottomSheetState
) {
    val scope = rememberCoroutineScope()
    val isAgreementOwner = story.initiatingUser.id == user?.id
    var actionModifier = Modifier
        .fillMaxWidth()
        .height(60.dp)

    if (isAgreementOwner) {
        actionModifier = actionModifier.clickable {
            scope.launch { sheetState.show() }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .clip(RoundedCornerShape(36.dp, 36.dp, 0.dp, 0.dp))
            .background(backgroundSecondary())
    ) {
        Row(
            modifier = actionModifier,
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (isAgreementOwner) {
                Text("Actions", style = MaterialTheme.typography.body1.copy(fontWeight = FontWeight.Bold))
                Icon(imageVector = Icons.Filled.ArrowDropDown, contentDescription = "Drop down arrow")
            } else {
                Text(
                    story.sharedExpense.getStatusDisplay(),
                    style = MaterialTheme.typography.body1.copy(fontWeight = FontWeight.Bold)
                )
            }
        }

        // Leave 120.dp of padding for user action UI elements
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = 120.dp, top = 60.dp)
        ) {
            item(story.initiatingUser.id) {
                AgreementUserCard(story = story, agreementUser = AgreementActiveUser(story.initiatingUser))
            }

            story.activeUsers.forEach { user ->
                item(user.id) {
                    AgreementUserCard(story = story, agreementUser = AgreementActiveUser(user))
                }
            }

            story.prospectiveUsers.forEach { invite ->
                item(invite.email) {
                    AgreementUserCard(story = story, agreementUser = AgreementUserInvite(invite))
                }
            }
        }

        if (user != null) {
            Action(
                agreementViewModel = agreementViewModel,
                story = story,
                setStory = setStory,
                user = user
            )
        }
    }
}

@Composable private fun Action(
    agreementViewModel: AgreementViewModel,
    story: SharedExpenseStory,
    setStory: (SharedExpenseStory) -> Unit,
    user: User
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val isLoading by agreementViewModel.isLoading.collectAsState()
    val status = story.getAgreementStatus(user)
    val agreement = story.findAgreement(user)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp),
        contentAlignment = Alignment.BottomCenter
    ) {
        // / Agreement is active, provide a means of canceling
        if (story.sharedExpense.isActive) {
            SlideToConfirm(
                slideInstructionText = "Swipe to cancel agreement",
                feedbackText = "Canceled"
            ) { reportStatus ->
                scope.launch {
                    try {
                        val updatedStory = if (agreement != null) {
                            agreementViewModel.declineAgreementAsync(agreement.id).await()
                        } else {
                            agreementViewModel.cancelAgreementAsync(story.sharedExpense.id).await()
                        }
                        reportStatus(SlideToConfirmResult.SUCCESS)
                        setStory(updatedStory)
                        Toast.makeText(context, "Agreement was canceled", Toast.LENGTH_LONG).show()
                    } catch (e: HttpException) {
                        if (e.shouldShowEmailConfirmation()) {
                            agreementViewModel.showEmailConfirmation.value = true
                        } else {
                            Timber.e(e)
                            Toast.makeText(context, "Failed to decline agreement", Toast.LENGTH_LONG).show()
                        }
                        reportStatus(SlideToConfirmResult.FAILURE)
                    } catch (e: Throwable) {
                        Timber.e(e)
                        reportStatus(SlideToConfirmResult.FAILURE)
                        Toast.makeText(context, "Failed to decline agreement", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }
        // / User has been invited, but hasn't accepted the agreement
        else if (status == AgreementStatus.PENDING && agreement != null) {
            AcceptOrDecline(agreementViewModel, agreement, setStory)
        }
        // We're loading an operation like canceling an agreement (important if triggered from action sheet)
        else if (isLoading) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(40.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                CircularProgressIndicator(color = Color.White, strokeWidth = 1.dp, modifier = Modifier.scale(0.8f))
            }
        }
        // / The agreement has been canceled
        else if (story.sharedExpense.dateTimeDeactivated != null) {
            Label("This agreement was canceled", isLoading)
        }
        // / User has accepted, but is waiting for others to accept
        else if (status == AgreementStatus.ACTIVE && story.sharedExpense.isPending) {
            Label("Waiting for all participants to accept", isLoading)
        } else if (story.sharedExpense.isPending) {
            Label("Waiting for all participants to accept", isLoading)
        }
    }
}

@Composable private fun Label(text: String, isLoading: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(90.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        if (isLoading) {
            CircularProgressIndicator(color = Color.White, strokeWidth = 1.dp)
        } else {
            Text(
                text = text,
                style = MaterialTheme.typography.body1.copy(fontWeight = FontWeight.Bold),
                textDecoration = TextDecoration.Underline
            )
        }
    }
}

@OptIn(ExperimentalMaterialApi::class)
@Composable
private fun ActionSheet(
    authenticatedUser: User,
    navController: NavController,
    story: SharedExpenseStory,
    sheetState: ModalBottomSheetState,
    agreementViewModel: AgreementViewModel,
    setStory: (SharedExpenseStory) -> Unit
) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val cancel = painterResource(id = R.drawable.user_cancel)
    val cardSuccess = painterResource(id = R.drawable.card_success)
    val close = painterResource(id = R.drawable.cancel_color_filled)

    BottomDrawerBody {
        if (story.sharedExpense.isActive) {
            MenuItem(icon = cardSuccess, text = "View Transactions") {
                scope.launch {
                    sheetState.hide()
                    navController.popBackStack()
                    navController.navigate("transactions?filter=${story.vendor?.id ?: 0}")
                }
            }
        }

        if (story.sharedExpense.isPending && authenticatedUser.id == story.sharedExpense.expenseOwnerUserId) {
            MenuItem(icon = cancel, text = "Cancel Agreement") {
                scope.launch {
                    agreementViewModel.isLoading.value = true
                    sheetState.hide()

                    try {
                        val updatedStory = agreementViewModel.cancelAgreementAsync(story.sharedExpense.id).await()
                        setStory(updatedStory)
                        Toast.makeText(context, "Agreement has been canceled", Toast.LENGTH_LONG).show()
                    } catch (e: Throwable) {
                        Timber.e(e)
                        Toast.makeText(context, "Failed to cancel agreement", Toast.LENGTH_LONG).show()
                    }

                    agreementViewModel.isLoading.value = false
                }
            }
        }

        MenuItem(icon = close, text = "Close") {
            scope.launch { sheetState.hide() }
        }
    }
}

@Composable private fun AcceptOrDecline(
    agreementViewModel: AgreementViewModel,
    agreement: SharedExpenseUserAgreement,
    setStory: (SharedExpenseStory) -> Unit
) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var declineIsLoading by remember { mutableStateOf(false) }
    var acceptIsLoading by remember { mutableStateOf(false) }

    fun declineAgreement() {
        if (acceptIsLoading || declineIsLoading) return

        scope.launch {
            declineIsLoading = true
            try {
                val updatedStory = agreementViewModel.declineAgreementAsync(agreement.id).await()
                setStory(updatedStory)
                Toast.makeText(context, "Agreement was declined", Toast.LENGTH_LONG).show()
            } catch (e: HttpException) {
                if (e.shouldShowEmailConfirmation()) {
                    agreementViewModel.showEmailConfirmation.value = true
                } else {
                    Timber.e(e)
                    Toast.makeText(context, "Failed to decline agreement", Toast.LENGTH_LONG).show()
                }
            } catch (e: Throwable) {
                Timber.e(e)
                Toast.makeText(context, "Failed to decline agreement", Toast.LENGTH_LONG).show()
            }
            declineIsLoading = false
        }
    }

    // We break out the accept function because it can be called from 2 different coroutine scopes
    // In one case we use the scope from this composable and in another case it happens automatically
    // from the PlaidViewModel coroutine scope when the account is linked
    suspend fun accept(accountId: Int) {
        scope.launch {
            acceptIsLoading = true
            try {
                val updatedStory = agreementViewModel.acceptAgreementAsync(agreement.id, accountId).await()
                setStory(updatedStory)
                Toast.makeText(context, "Agreement accepted!", Toast.LENGTH_LONG).show()
            } catch (e: HttpException) {
                if (e.shouldShowEmailConfirmation()) {
                    agreementViewModel.showEmailConfirmation.value = true
                } else {
                    Timber.e(e)
                    Toast.makeText(context, "Failed to accept agreement", Toast.LENGTH_LONG).show()
                }
            } catch (e: Throwable) {
                Timber.e(e)
                Toast.makeText(context, "Failed to accept agreement", Toast.LENGTH_LONG).show()
            }
            acceptIsLoading = false
        }
    }

    fun acceptAgreement() {
        if (acceptIsLoading || declineIsLoading) return
        val accountId = agreementViewModel.getPaymentAccountId(agreement.sharedExpenseId)

        if (accountId == null) {
            agreementViewModel.showAccountSelection(agreement.sharedExpenseId) { account ->
                // Note: this callback happens from a suspend function
                accept(account.id)
            }
            return
        }

        scope.launch {
            accept(accountId)
        }
    }

    Row(
        modifier = Modifier
            .width(320.dp)
            .height(100.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Button(
            colors = ButtonDefaults.buttonColors(backgroundColor = redDecline()),
            contentPadding = PaddingValues(horizontal = 40.dp, vertical = if (declineIsLoading) 12.dp else 18.dp),
            onClick = { if (!declineIsLoading) declineAgreement() }
        ) {
            if (declineIsLoading) {
                CircularProgressIndicator(color = Color.White, strokeWidth = 1.dp, modifier = Modifier.scale(0.8f))
            } else {
                Text(text = "Decline", style = MaterialTheme.typography.body1.copy(color = Color.White))
            }
        }

        Button(
            colors = ButtonDefaults.buttonColors(backgroundColor = greenAccept()),
            contentPadding = PaddingValues(horizontal = 40.dp, vertical = if (acceptIsLoading) 12.dp else 18.dp),
            onClick = { if (!acceptIsLoading) acceptAgreement() }
        ) {
            if (acceptIsLoading) {
                CircularProgressIndicator(color = Color.White, strokeWidth = 1.dp, modifier = Modifier.scale(0.8f))
            } else {
                Text(text = "Accept", style = MaterialTheme.typography.body1.copy(color = Color.White))
            }
        }
    }
}
