package com.equater.equater.sharedExpenseCreation.scheduledPayment

import android.widget.Toast
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.Button
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.MaterialTheme
import androidx.compose.material.ModalBottomSheetState
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.equater.equater.components.PlainTextField
import com.equater.equater.components.Select
import com.equater.equater.sharedExpenseCreation.ScheduledPaymentViewModel
import com.equater.equater.ui.backgroundSecondary
import com.equater.equater.ui.frameFillWidth
import kotlinx.coroutines.launch
import androidx.hilt.navigation.compose.hiltViewModel as hiltViewModel1

@OptIn(ExperimentalMaterialApi::class)
@Composable
fun SelectFrequencyPrompt(
    intervalSheetState: ModalBottomSheetState,
    onSelected: () -> Unit,
    scheduledPaymentViewModel: ScheduledPaymentViewModel = hiltViewModel1()
) {
    val context = LocalContext.current

    fun next() {
        if (scheduledPaymentViewModel.frequencyIsValid()) {
            onSelected()
        } else {
            Toast.makeText(context, "Enter a valid number", Toast.LENGTH_SHORT).show()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(18.dp)
            .padding(top = 100.dp)
    ) {
        Text(text = "How often will you be collecting payment?", style = MaterialTheme.typography.h5)
        FrequencySelection(intervalSheetState = intervalSheetState, next = ::next)
        Button(
            onClick = ::next,
            modifier = Modifier.frameFillWidth(60.dp)
        ) {
            Text(text = "Next", style = MaterialTheme.typography.body1.copy(color = Color.White))
        }
    }
}

@OptIn(ExperimentalMaterialApi::class, androidx.compose.ui.ExperimentalComposeUiApi::class)
@Composable
private fun FrequencySelection(
    intervalSheetState: ModalBottomSheetState,
    next: () -> Unit,
    viewModel: ScheduledPaymentViewModel = hiltViewModel1()
) {
    val scope = rememberCoroutineScope()
    val frequency by viewModel.frequency.collectAsState()
    val interval by viewModel.recurrenceInterval.collectAsState()
    var isError by remember { mutableStateOf(false) }
    val focusRequester = remember { FocusRequester() }
    val keyboard = LocalSoftwareKeyboardController.current

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "Every",
            style = MaterialTheme.typography.body1.copy(fontSize = 16.sp),
            modifier = Modifier.padding(end = 18.dp)
        )

        PlainTextField(
            value = if (frequency == 0) "" else frequency.toString(),
            onValueChanged = {
                val value = it.replace(",", "").replace("-", "").trim()

                try {
                    viewModel.frequency.value = value.toInt()
                    isError = false
                } catch (e: Throwable) {
                    isError = true
                    viewModel.frequency.value = 0
                }
            },
            modifier = Modifier
                .padding(end = 18.dp)
                .focusRequester(focusRequester),
            isError = isError,
            backgroundColor = backgroundSecondary(),
            width = 120.dp,
            height = 54.dp,
            keyboardOptions = KeyboardOptions.Default.copy(
                keyboardType = KeyboardType.Number,
                imeAction = ImeAction.Next
            ),
            keyboardActions = KeyboardActions(onNext = {
                next()
            })
        )

        Select(text = interval.getDescription(frequency), width = 150.dp, height = 54.dp, onClick = {
            scope.launch {
                intervalSheetState.show()
                keyboard?.hide()
            }
        })
    }

    LaunchedEffect(true) {
        focusRequester.requestFocus()
    }
}
