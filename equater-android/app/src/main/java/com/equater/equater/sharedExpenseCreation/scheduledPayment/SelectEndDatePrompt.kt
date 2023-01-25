package com.equater.equater.sharedExpenseCreation.scheduledPayment

import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.Button
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Switch
import androidx.compose.material.SwitchDefaults
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.equater.equater.components.DatePickerTextInput
import com.equater.equater.extensions.formatMonthDayYear
import com.equater.equater.sharedExpenseCreation.ScheduledPaymentViewModel
import com.equater.equater.ui.frameFillWidth
import com.equater.equater.ui.textPrimaryColor

@Composable fun SelectEndDatePrompt(
    onSelected: () -> Unit,
    scheduledPaymentViewModel: ScheduledPaymentViewModel = hiltViewModel()
) {
    val endDate by scheduledPaymentViewModel.endDate.collectAsState()
    val startDate by scheduledPaymentViewModel.startDate.collectAsState()
    val isIndefinite by scheduledPaymentViewModel.isIndefinite.collectAsState()
    val context = LocalContext.current

    fun next() {
        if (scheduledPaymentViewModel.endDate.value.isBefore(scheduledPaymentViewModel.startDate.value)) {
            Toast.makeText(
                context,
                "Please pick a date after ${startDate.formatMonthDayYear()}",
                Toast.LENGTH_LONG
            ).show()
        } else {
            onSelected()
        }
    }

    Column(modifier = Modifier.padding(18.dp).padding(top = 24.dp), verticalArrangement = Arrangement.Center) {
        Text(text = "When is the last bill due?", style = MaterialTheme.typography.h5)

        Row(
            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = "No end date (indefinite)", style = MaterialTheme.typography.body1)

            Switch(
                modifier = Modifier.padding(horizontal = 8.dp),
                checked = isIndefinite,
                onCheckedChange = {
                    scheduledPaymentViewModel.isIndefinite.value = it
                },
                colors = SwitchDefaults.colors(
                    uncheckedThumbColor = textPrimaryColor()
                )
            )
        }

        if (!isIndefinite) {
            DatePickerTextInput(modifier = Modifier.padding(vertical = 16.dp), date = endDate, onDateSelected = {
                scheduledPaymentViewModel.endDate.value = it
            })
        }

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
