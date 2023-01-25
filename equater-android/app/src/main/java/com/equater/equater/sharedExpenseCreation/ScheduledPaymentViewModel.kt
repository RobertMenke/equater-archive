package com.equater.equater.sharedExpenseCreation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import arrow.core.Either
import arrow.core.continuations.nullable
import arrow.core.identity
import com.equater.equater.authentication.User
import com.equater.equater.authentication.UserAccount
import com.equater.equater.components.progressStepper.ScheduledPaymentStep
import com.equater.equater.database.repository.AgreementRepository
import com.equater.equater.extensions.formatMonthDayYear
import com.equater.equater.extensions.toIso8601
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import java.time.LocalDateTime
import javax.inject.Inject

enum class ScheduledPaymentSheetState {
    Hidden,
    FriendsSheetShowing,
    AmountsSheetShowing,
    DepositorySheetShowing
}

@HiltViewModel
class ScheduledPaymentViewModel @Inject constructor(
    private val agreementRepository: AgreementRepository
) : ViewModel() {
    val sheetState = MutableStateFlow(ScheduledPaymentSheetState.Hidden)
    val currentStep = MutableStateFlow(ScheduledPaymentStep.SelectFrequency)

    // / Determines whether the expenseFrequency is in terms of days or months
    val recurrenceInterval = MutableStateFlow(RecurringExpenseInterval.Months)

    // / Frequency in terms of days or months. Used in conjunction with interval.
    val frequency = MutableStateFlow(1)
    val startDate = MutableStateFlow(LocalDateTime.now().plusDays(1))
    val endDate = MutableStateFlow(LocalDateTime.now().plusYears(1))
    val isIndefinite = MutableStateFlow(false)
    val depositoryAccount = MutableStateFlow<UserAccount?>(null)
    val showEmailConfirmationDialog = MutableStateFlow(false)

    // / Expense sharing agreements can be initiated containing both active users
    // / and users we've invited to the platform. [activeUsers] is an array of
    // / user ids corresponding to users that are already on the platform.
    private val activeUsers: MutableStateFlow<Map<User, Either<Error, Contribution>>> = MutableStateFlow(mapOf())

    // / Expense sharing agreements can be initiated containing both active users
    // / and users we've invited to the platform. [prospectiveUsers] is an array of
    // / email addresses corresponding to users that should be invited to the platform.
    private val prospectiveUsers: MutableStateFlow<Map<String, Either<Error, Contribution>>> = MutableStateFlow(mapOf())

    fun createScheduledPaymentAsync(authenticatedUser: User): Deferred<SharedExpenseStory> = viewModelScope.async {
        val dto = createScheduledPaymentDto() ?: throw IllegalStateException(
            "Did not have all the information necessary to submit."
        )

        agreementRepository.createScheduledPayment(authenticatedUser.id, dto)
    }

    fun hasSelectedPayers(): Boolean {
        return activeUsers.value.isNotEmpty() || prospectiveUsers.value.isNotEmpty()
    }

    fun getActiveUsers() = activeUsers.value.keys.toList()

    fun getProspectiveUsers() = prospectiveUsers.value.keys.toList()

    private fun countTotalParticipants() = activeUsers.value.size + prospectiveUsers.value.size + 1

    // Frequency will be set to 0 when an invalid number is supplied
    fun frequencyIsValid(): Boolean {
        return frequency.value > 0
    }

    fun findError(): Error? {
        val error = activeUsers
            .value
            .values
            .firstNotNullOfOrNull {
                it.fold(::identity) { null }
            }

        if (error != null) {
            return error
        }

        return prospectiveUsers
            .value
            .values
            .firstNotNullOfOrNull {
                it.fold(::identity) { null }
            }
    }

    fun getContribution(user: User): Contribution? {
        return activeUsers.value[user]?.orNull()
    }

    fun getContribution(email: String): Contribution? {
        return prospectiveUsers.value[email]?.orNull()
    }

    fun addUsers(users: List<User>) {
        val map = mutableMapOf<User, Either<Error, Contribution>>()

        users.forEach {
            map[it] = Either.Right(Contribution.getDefault())
        }

        activeUsers.value = map
    }

    fun addInvites(emails: List<String>) {
        val map = mutableMapOf<String, Either<Error, Contribution>>()

        emails.forEach {
            map[it] = Either.Right(Contribution.getDefault())
        }

        prospectiveUsers.value = map
    }

    fun setContribution(user: User, contribution: Contribution) {
        val map = activeUsers.value.toMutableMap()
        map[user] = Either.Right(contribution)

        activeUsers.value = map
    }

    fun setContribution(invite: String, contribution: Contribution) {
        val map = prospectiveUsers.value.toMutableMap()
        map[invite] = Either.Right(contribution)

        prospectiveUsers.value = map
    }

    fun setError(user: User, error: Error) {
        val map = activeUsers.value.toMutableMap()
        map[user] = Either.Left(error)

        activeUsers.value = map
    }

    fun setError(invite: String, error: Error) {
        val map = prospectiveUsers.value.toMutableMap()
        map[invite] = Either.Left(error)

        prospectiveUsers.value = map
    }

    fun getFrequencyDescription(): String {
        return "${getFormattedStartDate()} - ${if (isIndefinite.value) "Indefinite" else getFormattedEndDate()}"
    }

    fun getFormattedStartDate(): String {
        return startDate.value.formatMonthDayYear()
    }

    private fun getFormattedEndDate(): String {
        return endDate.value.formatMonthDayYear()
    }

    fun getShortDescription(): String {
        return if (frequency.value == 1) {
            "Every ${recurrenceInterval.value.getDescription(frequency.value).replaceFirstChar { it.lowercase() }}"
        } else {
            val interval = recurrenceInterval.value.getDescription(frequency.value).replaceFirstChar { it.lowercase() }
            "Every ${frequency.value} $interval"
        }
    }

    fun setFixedContributions() {
        setAllContributions {
            Contribution(ExpenseContributionType.FIXED, 100)
        }
    }

    private fun setAllContributions(f: (totalContributors: Int) -> Contribution) {
        val total = countTotalParticipants()
        val users = getActiveUsers()
        val emails = getProspectiveUsers()
        val userMap = mutableMapOf<User, Either<Error, Contribution>>()
        val inviteMap = mutableMapOf<String, Either<Error, Contribution>>()

        users.forEach {
            userMap[it] = Either.Right(f(total))
        }

        emails.forEach {
            inviteMap[it] = Either.Right(f(total))
        }

        activeUsers.value = userMap
        prospectiveUsers.value = inviteMap
    }

    private fun createScheduledPaymentDto(): ScheduledPaymentDto? {
        return nullable.eager {
            ScheduledPaymentDto(
                activeUsers = createFinalizedActiveUserMap(),
                prospectiveUsers = createFinalizedProspectiveUserMap(),
                expenseNickName = getShortDescription(),
                interval = recurrenceInterval.value,
                expenseFrequency = frequency.value,
                startDate = startDate.value.toIso8601(),
                endDate = if (isIndefinite.value) null else endDate.value.toIso8601(),
                expenseOwnerDestinationAccountId = depositoryAccount.value.bind().id
            )
        }
    }

    private fun createFinalizedActiveUserMap(): Map<String, Contribution> {
        val users = getActiveUsers()
        val map: MutableMap<String, Contribution> = mutableMapOf()

        users.forEach { user ->
            val error = IllegalStateException("Failed to finalize active user map for DTO")
            val either = activeUsers.value[user] ?: throw error
            either.fold({ throw error }, {
                map["${user.id}"] = it
            })
        }

        return map
    }

    private fun createFinalizedProspectiveUserMap(): Map<String, Contribution> {
        val users = getProspectiveUsers()
        val map: MutableMap<String, Contribution> = mutableMapOf()

        users.forEach { email ->
            val error = IllegalStateException("Failed to finalize active user map for DTO")
            val either = prospectiveUsers.value[email] ?: throw error
            either.fold({ throw error }, {
                map[email] = it
            })
        }

        return map
    }
}
