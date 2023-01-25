package com.equater.equater.identityVerification

import android.app.Activity
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.ActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.Button
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.LocalTextStyle
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.material.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusEvent
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.equater.equater.R
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.authentication.User
import com.equater.equater.components.makeDatePicker
import com.equater.equater.global.EnvironmentService
import com.equater.equater.ui.frameFillParent
import com.equater.equater.ui.frameFillWidth
import com.google.android.libraries.places.api.model.Place
import com.google.android.libraries.places.widget.Autocomplete
import com.google.android.libraries.places.widget.model.AutocompleteActivityMode
import java.time.LocalDateTime

private const val unverifiedCustomerTitle = "Verify Your Identity"
private const val verifiedCustomerTitle = "Update Address"
private const val unverifiedCustomerSubTitle = "This information helps us keep Equater users safe and secure."

@Composable
fun AuthenticatedVerifiedCustomerForm(
    authViewModel: AuthenticationViewModel,
    modifier: Modifier = Modifier,
    onSuccess: ((User) -> Unit)? = null
) {
    Column {
        VerifiedCustomerForm(authViewModel = authViewModel, modifier = modifier, onSuccess = onSuccess)
    }
}

@Composable
fun VerifiedCustomerForm(
    authViewModel: AuthenticationViewModel,
    modifier: Modifier = Modifier,
    onSuccess: ((User) -> Unit)? = null
) {
    val context = LocalContext.current
    val viewModel: VerifiedCustomerViewModel = hiltViewModel()
    val authenticatedUser by authViewModel.authenticatedUser.collectAsState()
    val user = authenticatedUser ?: return
    val dateIsValid by viewModel.dateIsValid.collectAsState()
    val address by viewModel.address.collectAsState()
    val ssn by viewModel.lastFourOfSsn.collectAsState()
    val isLoading by viewModel.formSubmissionInProgress.collectAsState()

    fun getTitle(): String {
        return if (user.canReceiveFunds) verifiedCustomerTitle else unverifiedCustomerTitle
    }

    fun getSubtitle(): String {
        if (user.canReceiveFunds) {
            return context.getString(R.string.verified_customer_subtitle)
        }

        if (user.dwollaReverificationNeeded) {
            return context.getString(
                R.string.reverification_subtitle,
                EnvironmentService.getSupportEmail(),
                EnvironmentService.getSupportPhoneNumber()
            )
        }

        return unverifiedCustomerSubTitle
    }

    fun saveAddress() {
        if (isLoading) return
        if (address == null) {
            Toast.makeText(context, "Enter your address before saving", Toast.LENGTH_LONG).show()
            return
        }

        viewModel.saveAddress { user ->
            if (user != null) {
                onSuccess?.invoke(user)
                Toast.makeText(context, "Your address has been updated", Toast.LENGTH_LONG).show()
            } else {
                Toast.makeText(context, "Failed to update address", Toast.LENGTH_LONG).show()
            }
        }
    }

    fun saveIdentityVerification() {
        if (isLoading) return
        viewModel.saveIdentityVerification { user ->
            if (user != null) {
                onSuccess?.invoke(user)
            } else {
                Toast.makeText(context, "Failed to update address", Toast.LENGTH_LONG).show()
            }
        }
    }

    LaunchedEffect(true) {
        user.getAddress()?.let { address ->
            viewModel.address.value = address
            viewModel.apartmentUnitText.value = address.addressTwo ?: ""
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        Column(modifier = frameFillParent.padding(start = 16.dp, end = 16.dp)) {
            Text(text = getTitle(), style = MaterialTheme.typography.h2)
            Text(
                text = getSubtitle(),
                style = MaterialTheme.typography.body1,
                modifier = Modifier.padding(top = 4.dp, start = 2.dp)
            )

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(bottom = 110.dp)
            ) {
                item("address1") {
                    AddressInput(Modifier.padding(top = 12.dp))
                }
                item("address2") {
                    Address2Input(user, Modifier.padding(top = 12.dp), onSave = { saveAddress() })
                }

                // Once a user's identity has been verified, we can only update the address
                if (!user.canReceiveFunds) {
                    item("ssn") {
                        SocialSecurityNumberInput(Modifier.padding(top = 12.dp))
                    }
                    item("dob") {
                        DateOfBirthInput(Modifier.padding(top = 12.dp))
                    }
                }
            }
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = 40.dp)
                .padding(horizontal = 16.dp),
            contentAlignment = Alignment.BottomCenter
        ) {
            Button(
                onClick = {
                    if (isLoading) return@Button

                    if (address == null) {
                        Toast.makeText(context, "Enter your address to continue", Toast.LENGTH_LONG).show()
                        return@Button
                    }
                    // Once a user's identity has been verified, we can only update the address
                    if (user.canReceiveFunds) {
                        saveAddress()
                        return@Button
                    }

                    if (ssn.length != 4) {
                        Toast.makeText(
                            context,
                            "Enter the last 4 digits of your social security number",
                            Toast.LENGTH_LONG
                        ).show()
                    } else if (!dateIsValid) {
                        Toast.makeText(context, "Must be 18 or older to use Equater", Toast.LENGTH_LONG).show()
                    } else {
                        saveIdentityVerification()
                    }
                },
                modifier = Modifier
                    .frameFillWidth(70.dp)
                    .padding(top = 20.dp)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White, strokeWidth = 1.dp, modifier = Modifier.scale(0.8f))
                } else {
                    Text(
                        text = "Save",
                        style = MaterialTheme.typography.body1.copy(fontSize = 3.5.em, color = Color.White)
                    )
                }
            }
        }
    }
}

@Composable private fun AddressInput(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val viewModel: VerifiedCustomerViewModel = hiltViewModel()
    val addressText by viewModel.addressText.collectAsState()
    val focusRequester = remember { FocusRequester() }
    val focusManager = LocalFocusManager.current
    var isShowingPlaces by remember { mutableStateOf(false) }
    val placesLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result: ActivityResult ->
        isShowingPlaces = false
        if (result.resultCode == Activity.RESULT_OK) {
            result.data?.let { place ->
                val address = Autocomplete.getPlaceFromIntent(place)
                viewModel.address.value = Address.fromPlace(address)
                focusRequester.freeFocus()
                focusManager.clearFocus(true)
            }
        }
    }

    TextField(
        value = addressText,
        onValueChange = {},
        label = { Text(text = "Address") },
        textStyle = LocalTextStyle.current.copy(fontSize = 14.sp),
        placeholder = { Text(text = "Address") },
        modifier = modifier
            .frameFillWidth(60.dp)
            .focusRequester(focusRequester)
            .onFocusEvent {
                if (it.hasFocus && !isShowingPlaces) {
                    val fields = listOf(Place.Field.ADDRESS_COMPONENTS)
                    val intent = Autocomplete
                        .IntentBuilder(AutocompleteActivityMode.FULLSCREEN, fields)
                        .build(context)
                    placesLauncher.launch(intent)
                    isShowingPlaces = true
                }
            },
        keyboardOptions = KeyboardOptions.Default.copy(imeAction = ImeAction.Next)
    )
    Text("This will open an address search sheet", style = MaterialTheme.typography.body2)
}

@OptIn(ExperimentalComposeUiApi::class)
@Composable
private fun Address2Input(user: User, modifier: Modifier = Modifier, onSave: () -> Unit) {
    val viewModel: VerifiedCustomerViewModel = hiltViewModel()
    val address by viewModel.address.collectAsState()
    val address2 by viewModel.apartmentUnitText.collectAsState()
    val focusRequester = remember { FocusRequester() }
    val keyboard = LocalSoftwareKeyboardController.current

    if (address == null) {
        return
    }

    TextField(
        value = address2,
        onValueChange = viewModel::setApartmentUnitText,
        label = { Text(text = "Apartment/Suite") },
        textStyle = LocalTextStyle.current.copy(fontSize = 14.sp),
        placeholder = { Text(text = "Apartment/Suite") },
        modifier = modifier
            .frameFillWidth(60.dp)
            .focusRequester(focusRequester),
        keyboardOptions = KeyboardOptions.Default.copy(
            imeAction = if (user.canReceiveFunds) ImeAction.Go else ImeAction.Next
        ),
        keyboardActions = KeyboardActions(
            onGo = {
                onSave()
                keyboard?.hide()
            }
        )
    )
    Text("Optional", style = MaterialTheme.typography.body2)

    LaunchedEffect(true) {
        if (!user.canReceiveFunds) {
            focusRequester.requestFocus()
        }
    }
}

@Composable private fun SocialSecurityNumberInput(modifier: Modifier = Modifier) {
    val viewModel: VerifiedCustomerViewModel = hiltViewModel()
    val ssn by viewModel.lastFourOfSsn.collectAsState()

    TextField(
        value = ssn,
        onValueChange = viewModel::setSocialSecurityNumber,
        label = { Text(text = "Last 4 digits of SSN") },
        textStyle = LocalTextStyle.current.copy(fontSize = 14.sp),
        placeholder = { Text(text = "Last 4 digits of SSN") },
        modifier = modifier.frameFillWidth(60.dp),
        keyboardOptions = KeyboardOptions.Default.copy(imeAction = ImeAction.Next, keyboardType = KeyboardType.Number)
    )
    Text("End-to-end encrypted", style = MaterialTheme.typography.body2)
}

@Composable private fun DateOfBirthInput(modifier: Modifier = Modifier) {
    val viewModel: VerifiedCustomerViewModel = hiltViewModel()
    val text by viewModel.dateOfBirthDisplay.collectAsState()
    val dateOfBirth by viewModel.dateOfBirth.collectAsState()
    val focusRequester = remember { FocusRequester() }
    val focusManager = LocalFocusManager.current
    val datePicker = makeDatePicker(default = dateOfBirth, onDateSelected = { _, year, month, day ->
        val date = LocalDateTime.of(year, month + 1, day, 0, 0)
        viewModel.setDateOfBirth(date)
        focusRequester.freeFocus()
        focusManager.clearFocus(true)
    })

    TextField(
        value = text,
        onValueChange = { value -> println(value) },
        label = { Text(text = "Date of birth") },
        textStyle = LocalTextStyle.current.copy(fontSize = 14.sp),
        placeholder = { Text(text = "Date of birth") },
        modifier = modifier
            .frameFillWidth(60.dp)
            .focusRequester(focusRequester)
            .onFocusEvent {
                if (it.hasFocus && !datePicker.isShowing) {
                    datePicker.show()
                } else {
                    datePicker.hide()
                }
            },
        keyboardOptions = KeyboardOptions.Default.copy(imeAction = ImeAction.Next)
    )
    Text("Use the date picker to complete this field", style = MaterialTheme.typography.body2)
}
