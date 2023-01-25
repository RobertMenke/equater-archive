package com.equater.equater.sharedExpenseCreation.scheduledPayment

import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material.Button
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.equater.equater.components.DatePickerTextInput
import com.equater.equater.sharedExpenseCreation.ScheduledPaymentViewModel
import com.equater.equater.ui.frameFillWidth
import java.time.LocalDateTime

@Composable fun SelectStartDatePrompt(
    onSelected: () -> Unit,
    scheduledPaymentViewModel: ScheduledPaymentViewModel = hiltViewModel()
) {
    val startDate by scheduledPaymentViewModel.startDate.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(startDate) {
        scheduledPaymentViewModel.endDate.value = startDate.plusYears(1)
    }

    fun next() {
        if (scheduledPaymentViewModel.startDate.value.isBefore(LocalDateTime.now())) {
            Toast.makeText(context, "Please select a date in the future", Toast.LENGTH_SHORT).show()
        } else {
            onSelected()
        }
    }

    Column(
        modifier = Modifier
            .padding(14.dp)
            .padding(top = 24.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text(text = "When is the first bill due?", style = MaterialTheme.typography.h5)
        DatePickerTextInput(
            modifier = Modifier.padding(vertical = 16.dp),
            date = startDate,
            onDateSelected = {
                scheduledPaymentViewModel.startDate.value = it
            }
        )

        Button(
            onClick = ::next,
            modifier = Modifier
                .frameFillWidth(60.dp)
                .padding(top = 8.dp)
        ) {
            Text(text = "Next", style = MaterialTheme.typography.body1.copy(color = Color.White))
        }
    }
}
