package com.equater.equater.manageAgreements

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.annotation.ExperimentalCoilApi
import com.equater.equater.authentication.User
import com.equater.equater.components.UserAvatar
import com.equater.equater.components.UserInviteAvatar
import com.equater.equater.profile.Avatar
import com.equater.equater.sharedExpenseCreation.Contribution
import com.equater.equater.sharedExpenseCreation.SharedExpenseStory
import com.equater.equater.sharedExpenseCreation.SharedExpenseType
import com.equater.equater.sharedExpenseCreation.UserInvite
import com.equater.equater.sharedExpenseCreation.display
import com.equater.equater.sharedExpenseCreation.getContribution
import com.equater.equater.sharedExpenseCreation.totalContributors
import com.equater.equater.ui.backgroundPrimary
import com.equater.equater.ui.backgroundSecondary

@Composable
fun UserContributionRow(story: SharedExpenseStory, shape: Shape = RoundedCornerShape(0.dp, 0.dp, 8.dp, 8.dp)) {
    val totalContributors = story.totalContributors()
    val activeUsers = if (story.sharedExpense.sharedExpenseType == SharedExpenseType.TRANSACTION_WEB_HOOK) {
        listOf(story.initiatingUser) + story.activeUsers
    } else {
        story.activeUsers
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(120.dp)
            .padding(top = 1.dp)
            .clip(shape)
            .background(backgroundSecondary())
    ) {
        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
                .padding(vertical = 10.dp)
        ) {
            activeUsers.forEach {
                val contribution = story.getContribution(it) ?: return@forEach

                item(it.id) {
                    UserContribution(it, contribution, totalContributors, Modifier.padding(horizontal = 12.dp))
                }
            }

            story.prospectiveUsers.forEach {
                val contribution = story.getContribution(it.email) ?: return@forEach

                item(it.email) {
                    UserInviteContribution(it, contribution, totalContributors, Modifier.padding(horizontal = 12.dp))
                }
            }
        }
    }
}

@OptIn(ExperimentalCoilApi::class)
@Composable
fun UserContribution(
    user: User,
    contribution: Contribution?,
    totalParticipants: Int,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current

    Column(
        modifier = modifier.fillMaxHeight(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        UserAvatar(photo = Avatar(context, user), background = backgroundPrimary())

        if (contribution != null) {
            Text(
                text = contribution.display(totalParticipants),
                style = MaterialTheme.typography.body1.copy(fontSize = 14.sp),
                modifier = Modifier.padding(top = 4.dp)
            )
        }
    }
}

@OptIn(ExperimentalCoilApi::class)
@Composable
fun UserInviteContribution(
    invite: UserInvite,
    contribution: Contribution?,
    totalParticipants: Int,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxHeight(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        UserInviteAvatar(invite = invite, background = backgroundPrimary())

        if (contribution != null) {
            Text(
                text = contribution.display(totalParticipants),
                style = MaterialTheme.typography.body1.copy(fontSize = 14.sp),
                modifier = Modifier.padding(top = 4.dp)
            )
        }
    }
}

@OptIn(ExperimentalCoilApi::class)
@Composable
fun UserInviteContribution(
    email: String,
    contribution: Contribution?,
    totalParticipants: Int,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxHeight(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        UserInviteAvatar(email = email, background = backgroundPrimary())

        if (contribution != null) {
            Text(
                text = contribution.display(totalParticipants),
                style = MaterialTheme.typography.body1.copy(fontSize = 14.sp),
                modifier = Modifier.padding(top = 4.dp)
            )
        }
    }
}
