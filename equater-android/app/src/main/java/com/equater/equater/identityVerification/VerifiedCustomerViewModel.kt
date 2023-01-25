package com.equater.equater.identityVerification

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import arrow.core.computations.nullable
import com.equater.equater.authentication.User
import com.equater.equater.database.repository.UserRepository
import com.equater.equater.extensions.formatMonthDayYear
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.LocalDateTime
import javax.inject.Inject

@HiltViewModel
class VerifiedCustomerViewModel @Inject constructor(private val userRepository: UserRepository) : ViewModel() {
    var address: MutableStateFlow<Address?> = MutableStateFlow(null)

    val addressText: StateFlow<String> = address
        .map {
            it?.displayAddress() ?: ""
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(), "")

    var apartmentUnitText: MutableStateFlow<String> = MutableStateFlow("")

    private val minimumAge = LocalDateTime.now().minusYears(18)

    val dateOfBirth: MutableStateFlow<LocalDateTime> = MutableStateFlow(minimumAge)

    val dateOfBirthDisplay: MutableStateFlow<String> = MutableStateFlow("")

    val dateIsValid: MutableStateFlow<Boolean> = MutableStateFlow(false)

    val lastFourOfSsn: MutableStateFlow<String> = MutableStateFlow("")

    val formSubmissionInProgress: MutableStateFlow<Boolean> = MutableStateFlow(false)

    fun setApartmentUnitText(text: String) {
        apartmentUnitText.value = text
        address.value = address.value?.copy(addressTwo = text)
    }

    // Ensure only 4 digit numerical SSNs
    fun setSocialSecurityNumber(text: String) {
        var digits = text.filter { it.isDigit() }

        if (digits.length > 4) {
            digits = digits.substring(0..3)
        }

        if (digits != lastFourOfSsn.value) {
            lastFourOfSsn.value = digits
        }
    }

    fun setDateOfBirth(date: LocalDateTime) {
        dateOfBirth.value = date
        dateOfBirthDisplay.value = date.formatMonthDayYear()
        dateIsValid.value = date.isBefore(minimumAge)
    }

    // By the time we get here, none of these fields should be null because the composable
    // should perform the checks
    fun saveIdentityVerification(completion: (User?) -> Unit) {
        formSubmissionInProgress.value = true
        viewModelScope.launch(Dispatchers.IO) {
            val user = nullable {
                val address = address.value.bind()
                val ssn = lastFourOfSsn.value.bind()
                val dateOfBirth = dateOfBirth.value.bind()
                val dto = RecipientOfFundsFormDto.fromFormInputs(address, dateOfBirth, ssn)
                val response = userRepository.patchIdentityVerification(dto)
                response.body()
            }

            withContext(Dispatchers.Main) {
                formSubmissionInProgress.value = false
                completion(user)
            }
        }
    }

    fun saveAddress(completion: (User?) -> Unit) {
        formSubmissionInProgress.value = true
        viewModelScope.launch(Dispatchers.IO) {
            val user = nullable {
                val address = address.value.bind()
                val dto = PatchAddressDto(address)
                val response = userRepository.patchAddress(dto)
                response.body()
            }

            withContext(Dispatchers.Main) {
                formSubmissionInProgress.value = false
                completion(user)
            }
        }
    }
}
