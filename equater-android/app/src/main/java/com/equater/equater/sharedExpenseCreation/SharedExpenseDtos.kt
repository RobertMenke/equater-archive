package com.equater.equater.sharedExpenseCreation

import android.content.Context
import android.os.Parcelable
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import arrow.core.continuations.nullable
import coil.annotation.ExperimentalCoilApi
import com.equater.equater.R
import com.equater.equater.authentication.User
import com.equater.equater.authentication.UserAccount
import com.equater.equater.extensions.formatMonthDayYear
import com.equater.equater.extensions.toCurrency
import com.equater.equater.extensions.toLocalDateTime
import com.equater.equater.extensions.toTimestamp
import com.equater.equater.manageAgreements.SharedExpenseEntity
import com.equater.equater.profile.LocalImage
import com.equater.equater.profile.Photo
import com.equater.equater.profile.VendorLogo
import com.equater.equater.searchVendors.Vendor
import com.equater.equater.transaction.TransactionEntity
import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonValue
import kotlinx.parcelize.Parcelize
import kotlinx.serialization.Serializable
import java.lang.Integer.max

enum class ExpenseContributionType(@get:JsonValue val value: Int) {
    PERCENTAGE(0),
    FIXED(1),
    SPLIT_EVENLY(2);

    companion object {
        @JsonCreator
        fun fromInt(value: Int): ExpenseContributionType {
            return when (value) {
                0 -> PERCENTAGE
                1 -> FIXED
                2 -> SPLIT_EVENLY
                else -> throw Exception(
                    "Could not deserialize ExpenseContributionType with argument $value"
                )
            }
        }
    }
}

enum class RecurringExpenseInterval(@get:JsonValue val value: Int) {
    Days(0),
    Months(1);

    private val description: String
        get() = when (this) {
            Days -> "Days"
            Months -> "Months"
        }

    private val singularDescription: String
        get() = when (this) {
            Days -> "Day"
            Months -> "Month"
        }

    fun getDescription(frequency: Int) =
        if (frequency == 1) singularDescription else description

    fun getDescriptionLowerCase(frequency: Int) =
        if (frequency == 1) singularDescription else description

    companion object {
        fun fromInt(value: Int): RecurringExpenseInterval {
            return when (value) {
                0 -> Days
                1 -> Months
                else -> throw IllegalArgumentException(
                    "Invalid value passed to ${RecurringExpenseInterval::class.java.name}"
                )
            }
        }
    }
}

data class Contribution(
    val contributionType: ExpenseContributionType,

    // / Number rounded to the nearest cent for fixed amounts. No support for
    // / fractions of a percent for V1.
    // / For percentage amounts, this will be expressed as a whole number (e.g. 50% = 50)
    val contributionValue: Int?
) {
    companion object {
        // / By default, always use "Split Evenly"
        fun getDefault() = Contribution(ExpenseContributionType.SPLIT_EVENLY, null)
    }
}

fun Contribution.display(totalContributors: Int): String {
    return when (contributionType) {
        ExpenseContributionType.SPLIT_EVENLY -> "1/$totalContributors"
        ExpenseContributionType.PERCENTAGE -> "${contributionValue ?: "??"}%"
        ExpenseContributionType.FIXED -> contributionValue?.toCurrency() ?: "Remainder"
    }
}

data class SharedBillDto(
    // / Expense sharing agreements can be initiated containing both active users
    // / and users we've invited to the platform. [activeUsers] is an array of
    // / user ids corresponding to users that are already on the platform.
    val activeUsers: Map<String, Contribution>,

    // / Expense sharing agreements can be initiated containing both active users
    // / and users we've invited to the platform. [prospectiveUsers] is an array of
    // / email addresses corresponding to users that should be invited to the platform.
    val prospectiveUsers: Map<String, Contribution>,

    // / Name we'll be using to refer to this expense when we communicate with users
    val expenseNickName: String,

    val uniqueVendorId: Int,
    val expenseOwnerSourceAccountId: Int,
    val expenseOwnerDestinationAccountId: Int
)

data class ScheduledPaymentDto(
    // / Expense sharing agreements can be initiated containing both active users
    // / and users we've invited to the platform. [activeUsers] is an array of
    // / user ids corresponding to users that are already on the platform.
    val activeUsers: Map<String, Contribution>,

    // / Expense sharing agreements can be initiated containing both active users
    // / and users we've invited to the platform. [prospectiveUsers] is an array of
    // / email addresses corresponding to users that should be invited to the platform.
    val prospectiveUsers: Map<String, Contribution>,

    // / Name we'll be using to refer to this expense when we communicate with users
    val expenseNickName: String,

    val interval: RecurringExpenseInterval,

    val expenseFrequency: Int,

    // / ISO string
    val startDate: String,
    val endDate: String?,
    val expenseOwnerDestinationAccountId: Int
)

@JsonIgnoreProperties(ignoreUnknown = true)
@Serializable
@Parcelize
data class SharedExpense(
    val id: Int,
    val uniqueVendorId: Int?,
    val expenseOwnerUserId: Int,
    val expenseOwnerSourceAccountId: Int,
    val expenseOwnerDestinationAccountId: Int,
    val uuid: String,
    val expenseNickName: String,
    val dateTimeCreated: String, // iso8601
    val isActive: Boolean,
    val isPending: Boolean,
    val sharedExpenseType: SharedExpenseType,
    val expenseRecurrenceInterval: Int?,
    val expenseRecurrenceFrequency: Int?,
    val targetDateOfFirstCharge: String?, // iso8601
    val dateLastCharged: String?, // iso8601
    val dateNextPaymentScheduled: String?, // iso8601
    val dateTimeDeactivated: String? // iso8601
) : Parcelable

fun SharedExpense.getStatusDisplay(): String {
    if (isActive) {
        return "Active"
    }

    if (isPending) {
        return "Pending"
    }

    return "Canceled"
}

@JsonIgnoreProperties(ignoreUnknown = true)
@Serializable
@Parcelize
data class SharedExpenseUserAgreement(
    val id: Int,
    val sharedExpenseId: Int,
    val userId: Int,
    val uuid: String,
    val contributionType: ExpenseContributionType,
    val contributionValue: Int?,
    val isPending: Boolean,
    val isActive: Boolean,
    val dateTimeCreated: String, // iso8601
    val dateTimeBecameActive: String?, // iso8601
    val dateTimeBecameInactive: String?, // iso8601
    var paymentAccountId: Int? = null
) : Parcelable

@JsonIgnoreProperties(ignoreUnknown = true)
@Serializable
@Parcelize
data class UserInvite(
    val id: Int,
    val email: String,
    val uuid: String,
    val contributionType: ExpenseContributionType,
    val contributionValue: Int?,
    val dateTimeCreated: String, // iso8601
    val isConverted: Boolean,
    val dateTimeBecameUser: String?, // iso8601
    val sharedExpenseId: Int
) : Parcelable

enum class SharedExpenseType(@get:JsonValue val value: Int) {
    TRANSACTION_WEB_HOOK(0),
    RECURRING_DATE_AND_TIME(1);
    companion object {
        @JsonCreator
        fun fromInt(value: Int): SharedExpenseType {
            return when (value) {
                0 -> TRANSACTION_WEB_HOOK
                1 -> RECURRING_DATE_AND_TIME
                else -> throw Exception(
                    "Could not deserialize SharedExpenseType with argument $value"
                )
            }
        }
    }
}

fun UserInvite.emailPreview() = email.substring(0..2)

enum class AgreementStatus {
    ACTIVE,
    PENDING,
    INACTIVE
}

@Serializable
@Parcelize
data class SharedExpenseStory(
    val sharedExpense: SharedExpense,
    val initiatingUser: User,
    val vendor: Vendor?,
    val agreements: List<SharedExpenseUserAgreement>,
    val activeUsers: List<User>,
    val prospectiveUsers: List<UserInvite>
) : Parcelable

fun SharedExpenseStory.usesAccount(account: UserAccount): Boolean {
    val isExpenseOwnerDestinationAccount = sharedExpense.expenseOwnerDestinationAccountId == account.id
    val isExpenseOwnerSourceAccount = sharedExpense.expenseOwnerSourceAccountId == account.id
    if (isExpenseOwnerDestinationAccount || isExpenseOwnerSourceAccount) {
        return true
    }

    return agreements.any { agreement ->
        agreement.paymentAccountId == account.id
    }
}

fun SharedExpenseStory.findAgreement(user: User) = agreements.firstOrNull { it.userId == user.id }

fun SharedExpenseStory.getAgreementStatus(user: User): AgreementStatus {
    val agreement = findAgreement(user) ?: return AgreementStatus.INACTIVE

    if (agreement.isPending) {
        return AgreementStatus.PENDING
    }

    if (agreement.isActive) {
        return AgreementStatus.ACTIVE
    }

    return AgreementStatus.INACTIVE
}

fun SharedExpenseStory.toEntity(authenticatedUserId: Int) = SharedExpenseEntity(
    id = sharedExpense.id,
    authenticatedUserId = authenticatedUserId,
    story = this,
    dateTime = this.sharedExpense.dateTimeCreated.toTimestamp()
)

fun SharedExpenseStory.totalContributors() = activeUsers.size + prospectiveUsers.size + 1

fun SharedExpenseStory.getContribution(user: User): Contribution? {
    if (user.id == initiatingUser.id) {
        return getExpenseOwnerContribution()
    }

    val agreement = agreements.firstOrNull { it.userId == user.id }

    if (agreement != null) {
        return Contribution(agreement.contributionType, agreement.contributionValue)
    }

    return null
}

fun SharedExpenseStory.getContribution(email: String): Contribution? {
    val agreement = prospectiveUsers.firstOrNull { it.email == email }

    if (agreement != null) {
        return Contribution(agreement.contributionType, agreement.contributionValue)
    }

    return null
}

fun SharedExpenseStory.getExpenseOwnerContribution(): Contribution {
    val agreementType = agreements.firstOrNull()?.contributionType ?: prospectiveUsers.firstOrNull()?.contributionType

    if (agreementType == null) {
        return Contribution.getDefault()
    }

    return when (agreementType) {
        ExpenseContributionType.PERCENTAGE -> Contribution(
            ExpenseContributionType.PERCENTAGE,
            calculateRemainingPercentageForExpenseOwner()
        )
        ExpenseContributionType.FIXED -> Contribution(ExpenseContributionType.FIXED, null)
        ExpenseContributionType.SPLIT_EVENLY -> Contribution(ExpenseContributionType.SPLIT_EVENLY, null)
    }
}

fun SharedExpenseStory.calculateRemainingPercentageForExpenseOwner(): Int {
    val userContributions = agreements.map { Contribution(it.contributionType, it.contributionValue) }
    val prospectiveUserContributions = prospectiveUsers.map { Contribution(it.contributionType, it.contributionValue) }
    val contributions = userContributions + prospectiveUserContributions

    val sum = contributions.sumOf { it.contributionValue ?: 0 }

    return max(100 - sum, 0)
}

@OptIn(ExperimentalCoilApi::class)
@Composable
fun SharedExpenseStory.rememberAgreementImage(context: Context): Photo {
    return remember {
        if (vendor != null) {
            VendorLogo(context, vendor)
        } else {
            LocalImage(context, R.drawable.clock_icon_white_clipped)
        }
    }
}

fun SharedExpenseStory.getFrequencyText(): String {
    val text = nullable.eager {
        val frequency = sharedExpense.expenseRecurrenceFrequency.bind()
        val recurrenceInterval = sharedExpense.expenseRecurrenceInterval.bind()
        val interval = RecurringExpenseInterval.fromInt(recurrenceInterval)
        val startDate = sharedExpense.targetDateOfFirstCharge.bind().toLocalDateTime()

        return@eager "Every ${interval.getDescriptionLowerCase(frequency)} starting ${startDate.formatMonthDayYear()}"
    }

    return text ?: ""
}

fun SharedExpenseStory.getNextPaymentDateText(): String {
    if (!sharedExpense.isActive && !sharedExpense.isPending) {
        return ""
    }

    val text = nullable.eager {
        val nextDate = sharedExpense.dateNextPaymentScheduled.bind().toLocalDateTime()

        return@eager "Next charge is ${nextDate.formatMonthDayYear()}"
    }

    return text ?: ""
}

fun List<SharedExpenseStory>.filterByActive() = filter { it.sharedExpense.isActive }
fun List<SharedExpenseStory>.filterByPending() = filter { it.sharedExpense.isPending }
fun List<SharedExpenseStory>.filterByCanceled() = filter { !it.sharedExpense.isActive && !it.sharedExpense.isPending }
fun List<SharedExpenseStory>.filterByActiveUsingAccount(account: UserAccount) = filterByActive().filter {
    it.usesAccount(
        account
    )
}

fun List<SharedExpenseStory>.filterByInvitations(user: User) = filterByPending().filter {
    val agreement = it.findAgreement(user) ?: return@filter false

    return@filter agreement.isPending
}

fun List<SharedExpenseStory>.filterByPendingWithoutInvitation(user: User) = filterByPending().filter {
    val agreement = it.findAgreement(user) ?: return@filter true

    return@filter agreement.isActive
}

data class UserAgreementDto(
    val userAgreementId: Int,
    val doesAcceptAgreement: Boolean,
    // Payment account is null when declining agreement
    val paymentAccountId: Int?
)

data class CancelAgreementDto(
    val sharedExpenseId: Int
)

enum class DwollaTransferStatus(@get:JsonValue val value: String) {
    PENDING("pending"),
    PROCESSED("processed"),
    FAILED("failed"),
    CANCELED("cancelled");

    companion object {
        @JsonCreator
        fun fromString(value: String): DwollaTransferStatus {
            return when (value) {
                "pending" -> PENDING
                "processed" -> PROCESSED
                "failed" -> FAILED
                "canceled" -> CANCELED
                else -> throw Exception(
                    "Could not deserialize DwollaTransferStatus with argument $value"
                )
            }
        }
    }
}

@JsonIgnoreProperties(ignoreUnknown = true)
@Serializable
@Parcelize
data class SharedExpenseTransaction(
    val id: Int,
    val uuid: String,
    val plaidTransactionId: Int?,
    val idempotencyToken: String,
    val hasBeenTransferredToDestination: Boolean,
    val dateTimeTransferredToDestination: String?, // iso string
    val dateTimeTransactionScheduled: String?, // iso string
    val totalFeeAmount: Int,
    val totalTransactionAmount: Int,
    val sharedExpenseId: Int,
    val sharedExpenseUserAgreementId: Int,
    val destinationAccountId: Int,
    val sourceAccountId: Int,
    val destinationUserId: Int,
    val sourceUserId: Int,
    val dateTimeInitiated: String,
    val dwollaTransferUrl: String?,
    val dwollaTransferId: String?,
    val numberOfTimesAttempted: Int,
    val dwollaStatus: DwollaTransferStatus?,
    val dateTimeDwollaStatusUpdated: String? // iso string
) : Parcelable

@Serializable
@Parcelize
data class TransactionStory(
    val transaction: SharedExpenseTransaction,
    val vendor: Vendor?,
    val payer: User,
    val recipient: User,
    val sharedExpense: SharedExpense,
    val sharedExpenseAgreement: SharedExpenseUserAgreement
) : Parcelable

@OptIn(ExperimentalCoilApi::class)
@Composable
fun TransactionStory.rememberAgreementImage(context: Context): Photo {
    return remember {
        if (vendor != null) {
            VendorLogo(context, vendor)
        } else {
            LocalImage(context, R.drawable.clock_icon_white_clipped)
        }
    }
}

fun TransactionStory.toEntity(authenticatedUserId: Int) = TransactionEntity(
    id = transaction.id,
    authenticatedUserId = authenticatedUserId,
    story = this,
    dateTime = this.transaction.dateTimeInitiated.toTimestamp()
)
