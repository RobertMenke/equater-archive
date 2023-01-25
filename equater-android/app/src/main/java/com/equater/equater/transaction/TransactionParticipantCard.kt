package com.equater.equater.transaction

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
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
import com.equater.equater.extensions.toCurrency
import com.equater.equater.profile.Avatar
import com.equater.equater.ui.backgroundSecondary
import com.equater.equater.ui.lightGreenAccept
import com.equater.equater.ui.lightRedDecline

enum class TransactionParticipantRole {
    PAYER,
    RECIPIENT
}

@OptIn(ExperimentalCoilApi::class)
@Composable
fun TransactionParticipantCard(user: User, role: TransactionParticipantRole, amount: Int) {
    val context = LocalContext.current

    fun getAmount(): String {
        return amount.toCurrency()
    }

    @Composable fun getColor(): Color {
        return when (role) {
            TransactionParticipantRole.PAYER -> lightRedDecline()
            TransactionParticipantRole.RECIPIENT -> lightGreenAccept()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(100.dp)
            .padding(vertical = 4.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(backgroundSecondary())
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
        ) {
            UserAvatar(
                photo = Avatar(context, user),
                modifier = Modifier.padding(horizontal = 16.dp),
                size = 60.dp
            )
            Column(modifier = Modifier.fillMaxWidth(0.7f)) {
                Text(user.fullName(), style = MaterialTheme.typography.body1.copy(fontSize = 18.sp))
                Text(
                    user.email,
                    overflow = TextOverflow.Ellipsis,
                    maxLines = 1,
                    style = MaterialTheme.typography.body2.copy(fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
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
            Text(
                text = getAmount(),
                style = MaterialTheme.typography.body1.copy(color = getColor(), fontWeight = FontWeight.Bold)
            )
        }
    }
}
