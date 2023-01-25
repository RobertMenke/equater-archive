package com.equater.equater.transaction

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Divider
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.equater.equater.extensions.formatMonthDayYear
import com.equater.equater.extensions.toLocalDateTime
import com.equater.equater.sharedExpenseCreation.TransactionStory
import com.equater.equater.ui.backgroundSecondary
import com.equater.equater.ui.textSecondaryColor

@Composable fun TransactionDetailCard(story: TransactionStory) {
    fun getDateDescription(): String {
        val transaction = story.transaction

        if (transaction.dateTimeTransferredToDestination != null) {
            return "Paid On"
        }

        if (transaction.dateTimeTransactionScheduled != null) {
            return "Scheduled For"
        }

        return "Initiated On"
    }

    fun getDate(): String {
        val transaction = story.transaction
        val date = transaction.dateTimeTransferredToDestination
            ?: transaction.dateTimeTransactionScheduled
            ?: transaction.dateTimeInitiated

        return date.toLocalDateTime().formatMonthDayYear()
    }

    fun getStatus(): String {
        val status = story.transaction.dwollaStatus?.value ?: "pending"

        return status.replaceFirstChar { it.uppercase() }
    }

    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(backgroundSecondary())
            .padding(vertical = 12.dp, horizontal = 16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = getDateDescription(), style = MaterialTheme.typography.body1)
            Text(text = getDate(), style = MaterialTheme.typography.body1)
        }

        Divider(color = textSecondaryColor().copy(alpha = 0.5f))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = "Status", style = MaterialTheme.typography.body1)
            Text(text = getStatus(), style = MaterialTheme.typography.body1)
        }
    }
}
