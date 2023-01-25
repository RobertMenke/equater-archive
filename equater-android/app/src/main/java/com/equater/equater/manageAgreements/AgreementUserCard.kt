package com.equater.equater.manageAgreements

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.annotation.ExperimentalCoilApi
import com.equater.equater.authentication.User
import com.equater.equater.components.UserAvatar
import com.equater.equater.components.UserInviteAvatar
import com.equater.equater.profile.Avatar
import com.equater.equater.sharedExpenseCreation.AgreementStatus
import com.equater.equater.sharedExpenseCreation.SharedExpenseStory
import com.equater.equater.sharedExpenseCreation.UserInvite
import com.equater.equater.sharedExpenseCreation.display
import com.equater.equater.sharedExpenseCreation.getAgreementStatus
import com.equater.equater.sharedExpenseCreation.getContribution
import com.equater.equater.sharedExpenseCreation.getExpenseOwnerContribution
import com.equater.equater.sharedExpenseCreation.totalContributors
import com.equater.equater.ui.backgroundSecondary
import com.equater.equater.ui.greenAccept
import com.equater.equater.ui.redDecline
import com.equater.equater.ui.textSecondaryColor

sealed class AgreementUser
class AgreementActiveUser(val user: User) : AgreementUser()
class AgreementUserInvite(val invite: UserInvite) : AgreementUser()

@OptIn(ExperimentalCoilApi::class)
@Composable
fun AgreementUserCard(
    story: SharedExpenseStory,
    agreementUser: AgreementUser,
    modifier: Modifier = Modifier,
    background: Color = backgroundSecondary(),
    onClick: (() -> Unit)? = null
) {
    val context = LocalContext.current

    @Composable
    fun Picture(modifier: Modifier = Modifier) {
        when (agreementUser) {
            is AgreementActiveUser -> UserAvatar(
                photo = Avatar(context, agreementUser.user),
                modifier = modifier,
                size = 60.dp
            )
            is AgreementUserInvite -> UserInviteAvatar(
                invite = agreementUser.invite,
                modifier = modifier,
                size = 60.dp
            )
        }
    }

    fun makePrimaryText(): String {
        return when (agreementUser) {
            is AgreementActiveUser -> agreementUser.user.fullName()
            is AgreementUserInvite -> agreementUser.invite.email
        }
    }

    fun makeSecondaryText(): String {
        return when (agreementUser) {
            is AgreementActiveUser -> {
                if (story.initiatingUser.id == agreementUser.user.id) {
                    story.getExpenseOwnerContribution().display(story.totalContributors())
                } else {
                    val contribution = story.getContribution(agreementUser.user)
                    val display = contribution?.display(story.totalContributors())

                    if (display == null) agreementUser.user.email else "Pays $display"
                }
            }
            is AgreementUserInvite -> "Invite sent to email"
        }
    }

    @Composable
    fun AgreementStatusView() {
        when (agreementUser) {
            is AgreementActiveUser -> {
                if (story.initiatingUser.id == agreementUser.user.id) {
                    Text(text = "Owner", style = MaterialTheme.typography.body1.copy(color = greenAccept()))
                    return
                }

                when (story.getAgreementStatus(agreementUser.user)) {
                    AgreementStatus.ACTIVE -> Text(
                        text = "Active",
                        style = MaterialTheme.typography.body1.copy(color = greenAccept())
                    )
                    AgreementStatus.PENDING -> Text(
                        text = "Pending",
                        style = MaterialTheme.typography.body1.copy(color = textSecondaryColor())
                    )
                    AgreementStatus.INACTIVE -> Text(
                        text = "Canceled",
                        style = MaterialTheme.typography.body1.copy(color = redDecline())
                    )
                }
            }
            is AgreementUserInvite -> Text(
                text = "Pending",
                style = MaterialTheme.typography.body1.copy(color = textSecondaryColor())
            )
        }
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(80.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(background)
            .clickable { onClick?.invoke() },
        contentAlignment = Alignment.CenterStart
    ) {
        Row(modifier = modifier.fillMaxSize(), verticalAlignment = Alignment.CenterVertically) {
            Picture(modifier = Modifier.padding(horizontal = 16.dp))

            Column(modifier = Modifier.fillMaxSize().padding(end = 80.dp), verticalArrangement = Arrangement.Center) {
                Text(
                    text = makePrimaryText(),
                    style = MaterialTheme.typography.body1.copy(fontSize = 18.sp),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = makeSecondaryText(),
                    style = MaterialTheme.typography.body2.copy(fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
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
            AgreementStatusView()
        }
    }
}
