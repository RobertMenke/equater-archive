package com.equater.equater.profile

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonValue

data class ProfileDto(
    val firstName: String,
    val lastName: String
)

data class PreSignedUrlResponse(
    val preSignedUrl: String?
)

data class PreSignedUrlRequest(
    val photoType: PhotoType
)

data class PhotoUploadStatusDto(
    val profilePhotoUploadComplete: Boolean,
    val mimeType: String?,
    val photoType: PhotoType
)

enum class PhotoType(@get:JsonValue val value: String) {
    // Circular avatar photo
    AVATAR("AVATAR"),

    // Rectangular cover photo (sits behind avatar)
    COVER_PHOTO("COVER_PHOTO");

    companion object {
        @JsonCreator
        fun fromString(value: String): PhotoType {
            return when (value) {
                "AVATAR" -> AVATAR
                "COVER_PHOTO" -> COVER_PHOTO
                else -> throw Exception(
                    "Could not deserialize PhotoType because the argument $value does not match any known enum value"
                )
            }
        }
    }
}
