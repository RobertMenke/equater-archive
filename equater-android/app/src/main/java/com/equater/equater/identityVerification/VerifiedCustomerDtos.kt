package com.equater.equater.identityVerification

import android.os.Parcelable
import com.google.android.libraries.places.api.model.AddressComponent
import com.google.android.libraries.places.api.model.Place
import kotlinx.parcelize.Parcelize
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

@Parcelize
data class RecipientOfFundsFormDto(
    val address: Address,
    val dateOfBirth: String,
    val lastFourOfSsn: String
) : Parcelable {
    companion object {
        fun fromFormInputs(address: Address, dateOfBirth: LocalDateTime, ssn: String): RecipientOfFundsFormDto {
            return RecipientOfFundsFormDto(
                address = address,
                dateOfBirth = dateOfBirth.atOffset(ZoneOffset.UTC).format(DateTimeFormatter.ISO_DATE_TIME),
                lastFourOfSsn = ssn
            )
        }
    }
}

data class PatchAddressDto(
    val address: Address
)

@Parcelize
data class Address(
    val addressOne: String,
    val addressTwo: String?,
    val city: String,
    val state: String,
    val postalCode: String
) : Parcelable {

    companion object {
        fun fromPlace(result: Place): Address {
            val components = result.addressComponents?.asList() ?: throw Exception(
                "Failed to construct Address fromPlace"
            )

            return Address(
                getAddressOne(components),
                null,
                getGoogleAddressComponent(components, "locality"),
                getGoogleAddressComponentShortName(components, "administrative_area_level_1"),
                getGoogleAddressComponent(components, "postal_code")
            )
        }
    }

    fun displayAddress(): String {
        return "$addressOne, $city, $state, $postalCode"
    }
}

// MARK: - Parsing Google Places

private fun getAddressOne(components: List<AddressComponent>): String {
    val streetNumber = getGoogleAddressComponent(components, "street_number")
    val route = getGoogleAddressComponent(components, "route")

    return "$streetNumber $route"
}

private fun getGoogleAddressComponent(components: List<AddressComponent>, needle: String): String {
    val found = components.find { it.types.contains(needle) }

    if (found != null) {
        return found.name
    }

    return ""
}

private fun getGoogleAddressComponentShortName(components: List<AddressComponent>, needle: String): String {
    val found = components.find { it.types.contains(needle) }

    if (found != null) {
        return found.shortName ?: ""
    }

    return ""
}
