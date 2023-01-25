package com.equater.equater.searchVendors

import android.os.Parcelable
import android.text.style.CharacterStyle
import androidx.room.Entity
import androidx.room.PrimaryKey
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.google.android.libraries.places.api.model.AutocompletePrediction
import kotlinx.parcelize.Parcelize
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.Serializable

data class VendorSearchRequest(
    val searchTerm: String,
    val requiringInternalReview: Boolean = false
)

@OptIn(ExperimentalSerializationApi::class)
data class VendorSearchResponse(
    val vendors: List<Vendor>
)

@OptIn(ExperimentalSerializationApi::class)
@JsonIgnoreProperties(ignoreUnknown = true)
@Parcelize
@Serializable
@Entity
data class Vendor(
    @PrimaryKey
    val id: Int,
    val uuid: String,
    val ppdId: String?,
    val dateTimeAdded: String?, // iso date
    val dateTimeModified: String?, // iso date
    val totalNumberOfExpenseSharingAgreements: Int,
    val hasBeenReviewedInternally: Boolean,
    val vendorIdentityCannotBeDetermined: Boolean,
    val friendlyName: String,
    val logoS3Bucket: String?,
    val logoS3Key: String?,
    val logoUrl: String?,
    val logoUploadCompleted: Boolean,
    val logoSha256Hash: String?,
    val googlePlacesId: String?
) : Parcelable

data class FetchPopularVendorsRequest(
    val limit: Int = 50
)

// / This is used to create a UniqueVendor on the server
@Serializable
@Parcelize
data class GooglePlacesPredictionItem(
    val placeId: String,
    val fullText: String,
    val primaryText: String,
    val secondaryText: String
) : Parcelable {
    companion object {
        fun fromPrediction(prediction: AutocompletePrediction, style: CharacterStyle): GooglePlacesPredictionItem {
            return GooglePlacesPredictionItem(
                placeId = prediction.placeId,
                fullText = prediction.getFullText(style).toString(),
                primaryText = prediction.getPrimaryText(style).toString(),
                secondaryText = prediction.getSecondaryText(style).toString()
            )
        }
    }
}
