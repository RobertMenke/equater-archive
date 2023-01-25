package com.equater.equater.searchUsers

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.annotation.ExperimentalCoilApi
import com.equater.equater.components.UserInviteAvatar
import com.equater.equater.ui.backgroundSecondary

@OptIn(ExperimentalCoilApi::class)
@Composable
fun UserInviteCard(
    email: String,
    onClick: (String) -> Unit,
    title: String = email,
    subtitle: String = "Invite email sent",
    slot: (@Composable () -> Unit)?
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(100.dp)
            .padding(vertical = 4.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(backgroundSecondary())
            .clickable { onClick(email) }
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
        ) {
            UserInviteAvatar(
                email = email,
                modifier = Modifier.padding(horizontal = 12.dp),
                size = 60.dp
            )
            Column(modifier = Modifier.fillMaxWidth().padding(end = 88.dp)) {
                Text(
                    title,
                    style = MaterialTheme.typography.body1.copy(fontSize = 18.sp),
                    overflow = TextOverflow.Ellipsis,
                    maxLines = 1
                )
                Text(
                    subtitle,
                    overflow = TextOverflow.Ellipsis,
                    maxLines = 1,
                    style = MaterialTheme.typography.body2.copy(fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                )
            }
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
                .padding(end = 12.dp),
            contentAlignment = Alignment.CenterEnd
        ) {
            slot?.invoke()
        }
    }
}
