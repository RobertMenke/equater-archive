package com.equater.equater.transaction

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImagePainter
import coil.compose.rememberAsyncImagePainter
import com.equater.equater.R
import com.equater.equater.components.PhotoAvatar
import com.equater.equater.sharedExpenseCreation.SharedExpenseStory
import com.equater.equater.sharedExpenseCreation.TransactionStory
import com.equater.equater.sharedExpenseCreation.rememberAgreementImage
import com.equater.equater.ui.backgroundSecondary

@Composable
fun TransactionAgreementCard(
    story: TransactionStory,
    sharedExpenseStory: SharedExpenseStory,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null
) {
    val context = LocalContext.current

    @Composable fun getRightArrowPainter(): AsyncImagePainter {
        val drawable = if (isSystemInDarkTheme()) {
            R.drawable.chevron_right_dark_mode
        } else {
            R.drawable.chevron_right_light_mode
        }

        return rememberAsyncImagePainter(drawable)
    }

    fun makePrimaryText(): String {
        return sharedExpenseStory.initiatingUser.fullName()
    }

    fun makeSecondaryText(): String {
        return sharedExpenseStory.sharedExpense.expenseNickName
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(84.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(backgroundSecondary())
            .clickable { onClick?.invoke() },
        contentAlignment = Alignment.CenterStart
    ) {
        Row(modifier = modifier.fillMaxSize(), verticalAlignment = Alignment.CenterVertically) {
            PhotoAvatar(
                photo = story.rememberAgreementImage(context = context),
                modifier = Modifier.padding(horizontal = 16.dp),
                size = 60.dp
            )

            Column(modifier = Modifier.padding(start = 8.dp, end = 48.dp)) {
                Text(makePrimaryText(), style = MaterialTheme.typography.body2.copy(fontSize = 14.sp))
                Text(
                    text = makeSecondaryText(),
                    style = MaterialTheme.typography.body1.copy(fontSize = 14.sp, fontWeight = FontWeight.Bold),
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
            Image(painter = getRightArrowPainter(), contentDescription = "Right Arrow")
        }
    }
}
