package com.equater.equater.searchUsers

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.material.Divider
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.annotation.ExperimentalCoilApi
import com.equater.equater.components.UserAvatar
import com.equater.equater.components.UserInviteAvatar
import com.equater.equater.profile.Avatar
import com.equater.equater.ui.AppIcon
import com.equater.equater.ui.backgroundSecondary

@OptIn(ExperimentalCoilApi::class)
@Composable
fun UserSelectionRow(userSearchViewModel: UserSearchViewModel = hiltViewModel()) {
    val context = LocalContext.current
    val selectedUsers by userSearchViewModel.selectedUsers.collectAsState()
    val selectedEmails by userSearchViewModel.selectedEmails.collectAsState()

    if (selectedUsers.isEmpty() && selectedEmails.isEmpty()) {
        return
    }

    @Composable fun RemovableContent(onClick: () -> Unit, content: @Composable () -> Unit) {
        Box(modifier = Modifier.fillMaxSize()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                content()
            }
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.TopStart) {
                Image(
                    painter = AppIcon.CancelColorFilled.painterResource(),
                    contentDescription = "Close",
                    modifier = Modifier
                        .offset(y = (-4).dp, x = (-4).dp)
                        .size(40.dp)
                        .clickable { onClick() }
                )
            }
        }
    }

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxWidth()
            .height(96.dp)
    ) {
        val selectedTextWidth = 100.dp
        val selectedTextPadding = 8.dp
        val partialDividerWidth = (maxWidth - selectedTextWidth) / 2 - selectedTextPadding

        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.SpaceBetween,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(
                    modifier = Modifier
                        .width(partialDividerWidth)
                        .height(1.dp)
                        .background(backgroundSecondary())
                ) {}
                Text(
                    text = "Selected",
                    style = MaterialTheme.typography.body2.copy(fontSize = 13.sp),
                    modifier = Modifier
                        .padding(horizontal = selectedTextPadding)
                        .width(selectedTextWidth),
                    textAlign = TextAlign.Center
                )
                Column(
                    modifier = Modifier
                        .width(partialDividerWidth)
                        .height(1.dp)
                        .background(backgroundSecondary())
                ) {}
            }

            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(75.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                selectedUsers.forEach { user ->
                    item(user.id) {
                        RemovableContent(onClick = { userSearchViewModel.removeSelectedUser(user) }) {
                            UserAvatar(
                                photo = Avatar(context, user),
                                modifier = Modifier.padding(horizontal = 8.dp),
                                background = backgroundSecondary()
                            )
                        }
                    }
                }

                selectedEmails.forEach { email ->
                    item(email) {
                        RemovableContent(onClick = { userSearchViewModel.removeSelectedEmail(email) }) {
                            UserInviteAvatar(
                                email = email,
                                modifier = Modifier.padding(horizontal = 8.dp),
                                background = backgroundSecondary()
                            )
                        }
                    }
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(2.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Divider(color = backgroundSecondary())
            }
        }
    }
}
