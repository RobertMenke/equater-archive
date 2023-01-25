package com.equater.equater.transaction

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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
import coil.compose.AsyncImagePainter
import coil.compose.rememberAsyncImagePainter
import com.equater.equater.R
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.components.PhotoAvatar
import com.equater.equater.components.UserAvatar
import com.equater.equater.extensions.formatWithSlashes
import com.equater.equater.extensions.toCurrency
import com.equater.equater.extensions.toLocalDateTime
import com.equater.equater.profile.Avatar
import com.equater.equater.sharedExpenseCreation.TransactionStory
import com.equater.equater.sharedExpenseCreation.rememberAgreementImage
import com.equater.equater.ui.backgroundSecondary
import com.equater.equater.ui.frameFillHeight
import com.equater.equater.ui.lightGreenAccept
import com.equater.equater.ui.lightRedDecline
import com.equater.equater.ui.textPrimaryColor
import timber.log.Timber

@OptIn(ExperimentalCoilApi::class)
@Composable
fun TransactionListItem(
    authViewModel: AuthenticationViewModel,
    story: TransactionStory,
    onClick: (() -> Unit)? = null
) {
    val context = LocalContext.current
    val authenticatedUser by authViewModel.authenticatedUser.collectAsState()
    val user = authenticatedUser

    fun createTertiaryText(): String {
        if (user == null) {
            return ""
        }
        val verb = if (story.payer.id == user.id) "Paid to" else "Paid by"
        val otherUser = if (story.payer.id == user.id) story.recipient else story.payer
        val otherUserName = "${otherUser.firstName} ${otherUser.lastName}"

        return "$verb $otherUserName"
    }

    fun createSecondaryText(): String {
        return try {
            val date = story.transaction.dateTimeInitiated.toLocalDateTime()

            "${date.formatWithSlashes()} · "
        } catch (e: Throwable) {
            Timber.e(e)
            ""
        }
    }

    fun createSecondaryTextAmount(): String {
        return story.transaction.totalTransactionAmount.toCurrency()
    }

    @Composable fun getAmountColor(): Color {
        if (user == null) {
            return textPrimaryColor()
        }

        return if (story.transaction.sourceUserId == user.id) lightRedDecline() else lightGreenAccept()
    }

    @Composable fun getRightArrowPainter(): AsyncImagePainter {
        val drawable = if (isSystemInDarkTheme()) {
            R.drawable.chevron_right_dark_mode
        } else {
            R.drawable.chevron_right_light_mode
        }

        return rememberAsyncImagePainter(drawable)
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(100.dp)
            .padding(vertical = 4.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(backgroundSecondary())
            .clickable { onClick?.invoke() }
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
        ) {
            Box(modifier = Modifier.frameFillHeight(90.dp), contentAlignment = Alignment.Center) {
                PhotoAvatar(
                    photo = story.rememberAgreementImage(context),
                    modifier = Modifier
                        .padding(horizontal = 16.dp)
                        .offset(x = 12.dp, y = 2.dp),
                    size = 60.dp
                )

                val userAvatar = if (story.payer.id == authenticatedUser?.id) {
                    Avatar(context, story.recipient)
                } else {
                    Avatar(context, story.payer)
                }

                UserAvatar(
                    photo = userAvatar,
                    modifier = Modifier
                        .padding(horizontal = 16.dp)
                        .offset(x = (-12).dp, y = (-2).dp),
                    size = 60.dp
                )
            }

            Column(modifier = Modifier.padding(start = 8.dp, end = 48.dp)) {
                Text(createTertiaryText(), style = MaterialTheme.typography.body2.copy(fontSize = 12.sp))
                Text(
                    text = story.sharedExpense.expenseNickName,
                    style = MaterialTheme.typography.body1.copy(fontSize = 18.sp),
                    overflow = TextOverflow.Ellipsis,
                    maxLines = 1
                )
                Row {
                    Text(
                        createSecondaryText(),
                        style = MaterialTheme.typography.body2.copy(fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    )
                    Text(
                        createSecondaryTextAmount(),
                        style = MaterialTheme.typography.body2.copy(
                            fontSize = 14.sp,
                            color = getAmountColor(),
                            fontWeight = FontWeight.SemiBold
                        )
                    )
                }
            }
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
                .padding(end = 16.dp),
            contentAlignment = Alignment.CenterEnd
        ) {
            Image(
                painter = getRightArrowPainter(),
                contentDescription = "Right Arrow",
                modifier = Modifier.width(24.dp).height(24.dp)
            )
        }
    }
}
