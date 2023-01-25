package com.equater.equater.authentication

import android.os.Build
import android.os.Parcelable
import androidx.room.ColumnInfo
import androidx.room.Embedded
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.PrimaryKey
import arrow.core.continuations.nullable
import com.equater.equater.identityVerification.Address
import com.equater.equater.linkBankAccount.PlaidLinkResponse
import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonValue
import kotlinx.parcelize.Parcelize
import kotlinx.parcelize.RawValue
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import timber.log.Timber
import java.util.Locale

@JsonIgnoreProperties(ignoreUnknown = true, value = ["isAuthenticatedUser"])
@OptIn(ExperimentalSerializationApi::class)
@Serializable
@Parcelize
@Entity
data class User(
    @PrimaryKey
    val id: Int,
    val uuid: String,
    val email: String,
    val emailIsConfirmed: Boolean,
    val firstName: String,
    val lastName: String,
    val canReceiveFunds: Boolean,
    val profilePhotoUrl: String?,
    val profilePhotoUploadCompleted: Boolean,
    val profilePhotoSha256Hash: String?,
    val coverPhotoUploadCompleted: Boolean,
    val coverPhotoSha256Hash: String?,
    val onBoardingSelection: String? = null,
    val dateTimeCreated: String,
    val addressOne: String?,
    val addressTwo: String?,
    val city: String?,
    val state: String?,
    val postalCode: String?,
    val preSignedPhotoDownloadUrl: String?,
    val preSignedCoverPhotoDownloadUrl: String?,
    var acceptedTermsOfService: Boolean = false,
    var acceptedPrivacyPolicy: Boolean = false,
    var linkTokens: List<PlaidLinkToken> = arrayListOf(),
    var dwollaReverificationNeeded: Boolean = false,
    // This is for our user cache only
    var isAuthenticatedUser: Boolean
) : Parcelable {
    fun getDepositoryToken() = findToken(PlaidTokenType.AndroidDepositoryOnly)
    fun getCreditAndDepositoryToken() = findToken(PlaidTokenType.AndroidCreditAndDepository)

    fun fullName() = "$firstName $lastName"

    private fun findToken(type: PlaidTokenType): String? {
        val token = linkTokens.find { it.tokenType == type }

        return token?.plaidLinkToken
    }

    fun getAddress(): Address? {
        return nullable.eager {
            val addressOne = addressOne.bind()
            val city = city.bind()
            val state = state.bind()
            val postalCode = postalCode.bind()

            Address(addressOne, addressTwo, city, state, postalCode)
        }
    }
}

@Serializable
@Parcelize
@Entity(primaryKeys = ["userId", "relatedToUserId"])
data class Relationship(
    // This would be the user id of our embedded User instance
    val userId: Int,
    // This would be the authenticated user
    val relatedToUserId: Int,
    @Embedded val user: User
) : Parcelable {
    companion object {
        fun fromUser(user: User, relatedToUserId: Int) = Relationship(
            userId = user.id,
            relatedToUserId = relatedToUserId,
            user = user
        )
    }
}

@OptIn(ExperimentalSerializationApi::class)
@JsonIgnoreProperties(ignoreUnknown = true)
@Parcelize
@Entity(
    tableName = "user_account",
    foreignKeys = [
        ForeignKey(
            entity = User::class,
            parentColumns = arrayOf("id"),
            childColumns = arrayOf("userId"),
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class UserAccount(
    @PrimaryKey
    val id: Int,
    @ColumnInfo(index = true)
    val userId: Int,
    val accountId: String,
    val accountName: String,
    val accountSubType: String,
    val accountType: String,
    val institutionId: String,
    val institutionName: String,
    val isActive: Boolean,
    val hasRemovedFundingSource: Boolean,
    val dwollaFundingSourceId: String?,
    // ISO8601 String
    val dateOfLastPlaidTransactionPull: String?,
    val plaidLinkToken: String?,
    // / ISO8601 String
    val dateTimePlaidLinkTokenExpires: String?,
    var requiresPlaidReAuthentication: Boolean,
    var institution: @RawValue Institution,
    var linkTokens: List<PlaidLinkToken> = arrayListOf()
) : Parcelable {
    fun getItemUpdateToken(): PlaidLinkToken? {
        return linkTokens.find { it.tokenType == PlaidTokenType.AndroidItemUpdate }
    }
}

// / From the plaid docs: https://plaid.com/docs/link/duplicate-items/
// / You can compare a combination of the accounts’
// / institution_id, account name, and account mask to determine whether
// / your user has previously linked their account to your application.
fun UserAccount.matches(response: PlaidLinkResponse): Boolean {
    return institutionId == response.metaData.institution.institutionId &&
        accountName == response.metaData.account.name &&
        accountType == response.metaData.account.type &&
        accountSubType == response.metaData.account.subtype
}

@JsonIgnoreProperties(ignoreUnknown = true)
@Parcelize
@Serializable
data class Institution(
    val id: Int,
    val uuid: String,
    val institutionId: String,
    val name: String,
    val websiteUrl: String,
    val primaryColorHexCode: String,
    val logoUrl: String?,
    val logoSha256Hash: String?
) : Parcelable

@ExperimentalSerializationApi
@JsonIgnoreProperties(ignoreUnknown = true)
@Parcelize
@Serializable
data class PlaidLinkToken(
    val id: Int,
    val userId: Int,
    val userAccountId: Int?,
    val tokenType: PlaidTokenType,
    val plaidLinkToken: String,
    // / ISO8601 String
    val dateTimeTokenCreated: String,
    // / ISO8601 String
    val dateTimeTokenExpires: String
) : Parcelable

@ExperimentalSerializationApi
@Serializable(with = PlaidTokenTypeSerializer::class)
enum class PlaidTokenType(@get:JsonValue val tokenType: String) {
    DepositoryOnly("DEPOSITORY_ONLY"),
    CreditAndDepository("CREDIT_AND_DEPOSITORY"),
    AndroidDepositoryOnly("ANDROID_DEPOSITORY_ONLY"),
    AndroidCreditAndDepository("ANDROID_CREDIT_AND_DEPOSITORY"),
    ItemUpdate("ITEM_UPDATE"),
    AndroidItemUpdate("ANDROID_ITEM_UPDATE");

    companion object {
        @JsonCreator
        fun fromString(value: String): PlaidTokenType {
            return when (value) {
                "DEPOSITORY_ONLY" -> DepositoryOnly
                "CREDIT_AND_DEPOSITORY" -> CreditAndDepository
                "ANDROID_DEPOSITORY_ONLY" -> AndroidDepositoryOnly
                "ANDROID_CREDIT_AND_DEPOSITORY" -> AndroidCreditAndDepository
                "ITEM_UPDATE" -> ItemUpdate
                "ANDROID_ITEM_UPDATE" -> AndroidItemUpdate
                else -> throw RuntimeException("Failed to deserialize PlaidTokenType from string $value")
            }
        }

        fun fromKey(key: String): PlaidTokenType {
            return values().find { it.tokenType == key } ?: throw RuntimeException(
                "Failed to deserialize PlaidTokenType from string $key"
            )
        }
    }
}

@ExperimentalSerializationApi
object PlaidTokenTypeSerializer : KSerializer<PlaidTokenType> {
    override fun deserialize(decoder: Decoder): PlaidTokenType {
        return try {
            val key = decoder.decodeString()
            PlaidTokenType.fromKey(key)
        } catch (e: Throwable) {
            Timber.e(e)
            throw e
        }
    }

    override val descriptor: SerialDescriptor
        get() = PrimitiveSerialDescriptor("PlaidTokenType", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: PlaidTokenType) {
        encoder.encodeString(value.tokenType)
    }
}

data class SignInRequest(
    val email: String,
    val password: String
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class SignInResponse(
    val authToken: String,
    val user: User,
    val userAccounts: List<UserAccount>
)

data class ResetPasswordDto(
    val email: String
)

data class EmailDto(
    val email: String
)

data class EnvironmentDetails(
    val serverEnvironment: String,
    val plaidEnvironment: String
)

fun User.initials(): String {
    if (firstName.isEmpty() || lastName.isEmpty()) {
        return ""
    }

    val firstInitial = firstName.first().toString()
    val lastInitial = lastName.first().toString()

    return firstInitial.uppercase(Locale.ROOT) + lastInitial.uppercase(Locale.ROOT)
}

enum class UserOnBoardingState {
    SplashScreen,
    ShouldRegister,
    ShouldCreateProfile,
    ShouldVerifyIdentity,
    ShouldAgreeToTerms,
    ShouldAgreeToPrivacyPolicy,
    OnBoardingCompleted
}

fun User.profileIsComplete() = firstName.isNotEmpty() && lastName.isNotEmpty()

data class DeviceRegistrationDto(
    val fcmToken: String,
    val deviceModel: String,
    val deviceOsVersion: String,
    val deviceOsName: String
) {
    companion object {
        fun fromToken(token: String): DeviceRegistrationDto {
            return DeviceRegistrationDto(
                fcmToken = token,
                deviceModel = Build.MODEL,
                deviceOsVersion = Build.VERSION.RELEASE,
                deviceOsName = "Android"
            )
        }
    }
}

data class LegalDocAcceptanceDto(
    val acceptedTermsOfService: Boolean,
    val acceptedPrivacyPolicy: Boolean
)

@JsonIgnoreProperties(ignoreUnknown = true)
@Parcelize
@Serializable
data class Balance(
    val dineroValueRepresentation: Int,
    val id: String,
    val status: String,
    val type: String,
    val bankAccountType: String?,
    val name: String,
    val created: String,
    val removed: Boolean,
    val channels: List<String>,
    val bankName: String?,
    val fingerprint: String?
) : Parcelable

@JsonIgnoreProperties(ignoreUnknown = true)
@Parcelize
@Serializable
data class OnBoardingFeedback(
    val selection: String,
    val additionalFeedback: String? = null
) : Parcelable
