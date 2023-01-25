package com.equater.equater.manageAgreements

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.annotation.ExperimentalCoilApi
import coil.compose.AsyncImage
import com.equater.equater.R
import com.equater.equater.authentication.User
import com.equater.equater.components.PhotoAvatar
import com.equater.equater.extensions.shouldShowEmailConfirmation
import com.equater.equater.sharedExpenseCreation.SharedExpenseStory
import com.equater.equater.sharedExpenseCreation.SharedExpenseUserAgreement
import com.equater.equater.sharedExpenseCreation.findAgreement
import com.equater.equater.sharedExpenseCreation.rememberAgreementImage
import com.equater.equater.ui.backgroundPrimary
import com.equater.equater.ui.backgroundSecondary
import com.equater.equater.ui.lightGreenAccept
import com.equater.equater.ui.lightRedDecline
import com.equater.equater.ui.textPrimaryColor
import kotlinx.coroutines.launch
import retrofit2.HttpException
import timber.log.Timber

@Composable
fun AgreementCard(
    user: User,
    story: SharedExpenseStory,
    agreementViewModel: AgreementViewModel,
    onClick: () -> Unit
) {
    val agreement = story.findAgreement(user)
    val isPending = agreement?.isPending == true
    val userRowShape = if (isPending) RoundedCornerShape(0.dp) else RoundedCornerShape(0.dp, 0.dp, 8.dp, 8.dp)

    Column(modifier = Modifier.padding(vertical = 4.dp)) {
        AgreementCardHeader(story, onClick)
        UserContributionRow(story, userRowShape)

        if (agreement != null && agreement.isPending) {
            AcceptOrDecline(agreementViewModel = agreementViewModel, agreement = agreement)
        }
    }
}

@OptIn(ExperimentalCoilApi::class)
@Composable
fun AgreementCardHeader(story: SharedExpenseStory, onClick: () -> Unit) {
    val context = LocalContext.current
    val drawable = if (isSystemInDarkTheme()) {
        R.drawable.chevron_right_dark_mode
    } else {
        R.drawable.chevron_right_light_mode
    }
    val image = story.rememberAgreementImage(context = context)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(100.dp)
            .padding(vertical = 0.dp)
            .clip(RoundedCornerShape(8.dp, 8.dp, 0.dp, 0.dp))
            .background(backgroundSecondary())
            .clickable { onClick() }
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
        ) {
            PhotoAvatar(
                photo = image,
                modifier = Modifier.padding(horizontal = 12.dp),
                background = backgroundPrimary()
            )

            Column(modifier = Modifier.padding(start = 8.dp, end = 48.dp)) {
                Text(story.initiatingUser.fullName(), style = MaterialTheme.typography.body2.copy(fontSize = 12.sp))
                Text(
                    text = story.sharedExpense.expenseNickName,
                    style = MaterialTheme.typography.body1.copy(fontSize = 18.sp),
                    overflow = TextOverflow.Ellipsis,
                    maxLines = 1
                )
            }
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
                .padding(end = 16.dp),
            contentAlignment = Alignment.CenterEnd
        ) {
            AsyncImage(model = drawable, contentDescription = "Right Arrow")
        }
    }
}

@Composable
private fun AcceptOrDecline(agreementViewModel: AgreementViewModel, agreement: SharedExpenseUserAgreement) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var declineIsLoading by remember { mutableStateOf(false) }
    var acceptIsLoading by remember { mutableStateOf(false) }

    fun declineAgreement() {
        if (acceptIsLoading || declineIsLoading) return

        scope.launch {
            declineIsLoading = true
            try {
                agreementViewModel.declineAgreementAsync(agreement.id).await()
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
                agreementViewModel.acceptAgreementAsync(agreement.id, accountId).await()
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
                Toast.makeText(context, "Failed to accept agreement 2", Toast.LENGTH_LONG).show()
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

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxWidth()
            .height(60.dp)
            .padding(top = 1.dp)
            .clip(RoundedCornerShape(0.dp, 0.dp, 8.dp, 8.dp))
            .background(backgroundSecondary())
    ) {
        val width = maxWidth

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
                .background(backgroundPrimary())
        ) {
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .width((width / 2) - 1.dp)
                    .background(backgroundSecondary())
                    .clip(RoundedCornerShape(0.dp, 0.dp, 8.dp, 0.dp))
                    .clickable { declineAgreement() },
                contentAlignment = Alignment.Center
            ) {
                if (declineIsLoading) {
                    CircularProgressIndicator(
                        color = textPrimaryColor(),
                        strokeWidth = 1.dp,
                        modifier = Modifier.scale(0.8f)
                    )
                } else {
                    Text(
                        text = "Decline",
                        style = MaterialTheme.typography.body1.copy(
                            color = lightRedDecline(),
                            fontWeight = FontWeight.Bold
                        )
                    )
                }
            }

            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .padding(start = 1.dp)
                    .width(width / 2)
                    .background(backgroundSecondary())
                    .clip(RoundedCornerShape(0.dp, 0.dp, 0.dp, 8.dp))
                    .clickable { acceptAgreement() },
                contentAlignment = Alignment.Center
            ) {
                if (acceptIsLoading) {
                    CircularProgressIndicator(
                        color = textPrimaryColor(),
                        strokeWidth = 1.dp,
                        modifier = Modifier.scale(0.8f)
                    )
                } else {
                    Text(
                        text = "Accept",
                        style = MaterialTheme.typography.body1.copy(
                            color = lightGreenAccept(),
                            fontWeight = FontWeight.Bold
                        )
                    )
                }
            }
        }
    }
}
