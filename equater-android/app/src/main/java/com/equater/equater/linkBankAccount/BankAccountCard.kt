package com.equater.equater.linkBankAccount

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
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
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.equater.equater.R
import com.equater.equater.authentication.UserAccount
import com.equater.equater.components.BankAccountPhoto
import com.equater.equater.profile.PlaidInstitution
import com.equater.equater.ui.backgroundSecondary

@Composable
fun BankAccountCard(
    account: UserAccount,
    onTap: (UserAccount) -> Unit,
    modifier: Modifier = Modifier,
    includeTrailingIcon: Boolean = false
) {
    val context = LocalContext.current
    val photo = remember { PlaidInstitution(context, account.institution) }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(100.dp)
            .padding(vertical = 4.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(backgroundSecondary())
            .clickable { onTap(account) }
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
        ) {
            BankAccountPhoto(
                photo = photo,
                modifier = Modifier.padding(horizontal = 16.dp),
                size = 60.dp
            )

            Column {
                Text(account.institutionName, style = MaterialTheme.typography.body1.copy(fontSize = 18.sp))
                Text(
                    account.accountName,
                    style = MaterialTheme.typography.body2.copy(fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                )
            }
        }

        if (includeTrailingIcon) {
            val rightArrow = if (isSystemInDarkTheme()) {
                R.drawable.chevron_right_dark_mode
            } else {
                R.drawable.chevron_right_light_mode
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight()
                    .padding(end = 16.dp),
                contentAlignment = Alignment.CenterEnd
            ) {
                AsyncImage(model = rightArrow, contentDescription = "Right Arrow")
            }
        }
    }
}
