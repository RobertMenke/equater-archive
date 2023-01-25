package com.equater.equater.sharedExpenseCreation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import arrow.core.Either
import arrow.core.continuations.nullable
import arrow.core.identity
import com.equater.equater.authentication.User
import com.equater.equater.authentication.UserAccount
import com.equater.equater.components.progressStepper.SharedBillStep
import com.equater.equater.database.repository.AgreementRepository
import com.equater.equater.extensions.possessive
import com.equater.equater.searchVendors.Vendor
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import java.lang.Integer.max
import javax.inject.Inject

enum class SharedBillSheetState {
    Hidden,
    VendorSheetShowing,
    FriendsSheetShowing,
    SharingModelSheetShowing,
    AccountSheetShowing,
    DepositorySheetShowing
}

@HiltViewModel
class SharedBillViewModel @Inject constructor(private val agreementRepository: AgreementRepository) : ViewModel() {
    val sheetState = MutableStateFlow(SharedBillSheetState.Hidden)
    val currentStep = MutableStateFlow(SharedBillStep.SelectVendor)
    val vendor = MutableStateFlow<Vendor?>(null)
    val creditAccount = MutableStateFlow<UserAccount?>(null)
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

    fun createSharedBillAsync(authenticatedUser: User): Deferred<SharedExpenseStory> = viewModelScope.async {
        val dto = createSharedBillDto(authenticatedUser) ?: throw IllegalStateException(
            "Did not have all the information necessary to submit."
        )

        agreementRepository.createSharedBill(authenticatedUser.id, dto)
    }

    fun hasSelectedPayers(): Boolean {
        return activeUsers.value.isNotEmpty() || prospectiveUsers.value.isNotEmpty()
    }

    fun getActiveUsers() = activeUsers.value.keys.toList()

    fun getProspectiveUsers() = prospectiveUsers.value.keys.toList()

    private fun countTotalParticipants() = activeUsers.value.size + prospectiveUsers.value.size + 1

    fun findError(): Error? {
        val error = activeUsers
            .value
            .values
            .mapNotNull {
                it.fold(::identity) { null }
            }
            .firstOrNull()

        if (error != null) {
            return error
        }

        return prospectiveUsers
            .value
            .values
            .mapNotNull {
                it.fold(::identity) { null }
            }
            .firstOrNull()
    }

    fun getContribution(user: User): Contribution? {
        return activeUsers.value[user]?.orNull()
    }

    fun getContribution(email: String): Contribution? {
        return prospectiveUsers.value[email]?.orNull()
    }

    private fun getAllContributions(): List<Contribution> {
        val active = activeUsers.value.values.mapNotNull {
            it.fold({ null }, ::identity)
        }

        val prospective = prospectiveUsers.value.values.mapNotNull {
            it.fold({ null }, ::identity)
        }

        return (active + prospective).toList()
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

    fun setSplitEvenlyContributions() {
        setAllContributions {
            Contribution.getDefault()
        }
    }

    fun setPercentageContributions() {
        setAllContributions { total ->
            val percent = 100.floorDiv(total)
            Contribution(ExpenseContributionType.PERCENTAGE, percent)
        }
    }

    fun setFixedContributions() {
        setAllContributions {
            Contribution(ExpenseContributionType.FIXED, 500)
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

    fun getRemainingPercentageContribution(): Int {
        val contributions = getAllContributions()
            .filter { it.contributionType == ExpenseContributionType.PERCENTAGE }
            .mapNotNull { it.contributionValue }

        return max(0, 100 - contributions.sum())
    }

    fun getExpenseOwnerContribution(): Contribution {
        val contributions = getAllContributions()

        if (contributions.isEmpty()) {
            return Contribution(ExpenseContributionType.SPLIT_EVENLY, null)
        }

        return when (contributions.first().contributionType) {
            ExpenseContributionType.PERCENTAGE -> Contribution(
                ExpenseContributionType.PERCENTAGE,
                getRemainingPercentageContribution()
            )
            ExpenseContributionType.FIXED -> Contribution(ExpenseContributionType.FIXED, null)
            ExpenseContributionType.SPLIT_EVENLY -> Contribution(ExpenseContributionType.SPLIT_EVENLY, null)
        }
    }

    private fun createSharedBillDto(user: User): SharedBillDto? {
        return nullable.eager {
            val vendor = vendor.value.bind()
            val sourceAccount = (creditAccount.value ?: depositoryAccount.value).bind()
            val destinationAccount = depositoryAccount.value.bind()

            SharedBillDto(
                activeUsers = createFinalizedActiveUserMap(),
                prospectiveUsers = createFinalizedProspectiveUserMap(),
                expenseNickName = "${user.firstName.possessive()} ${vendor.friendlyName} bill",
                uniqueVendorId = vendor.id,
                expenseOwnerSourceAccountId = sourceAccount.id,
                expenseOwnerDestinationAccountId = destinationAccount.id
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
