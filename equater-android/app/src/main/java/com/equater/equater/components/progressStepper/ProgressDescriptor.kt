package com.equater.equater.components.progressStepper

interface ProgressStepperDescriptor {
    fun getSteps(): List<ProgressStepperDescriptor>

    fun getStepIndex(): Int

    fun getTitle(): String

    fun hasBeenVisited(currentStep: ProgressStepperDescriptor): Boolean {
        return currentStep.getStepIndex() >= getStepIndex()
    }

    fun isAfter(step: ProgressStepperDescriptor): Boolean = getStepIndex() > step.getStepIndex()

    fun isBefore(step: ProgressStepperDescriptor): Boolean = getStepIndex() < step.getStepIndex()

    fun getPreviousStep(): ProgressStepperDescriptor?

    fun getNextStep(): ProgressStepperDescriptor?
}

enum class SharedBillStep(private val index: Int) : ProgressStepperDescriptor {
    SelectVendor(1),
    SelectUsers(2),
    SelectSharingModel(3),
    SelectAccount(4),
    Review(5);

    override fun getSteps(): List<ProgressStepperDescriptor> {
        return values().asList()
    }

    override fun getStepIndex(): Int {
        return index
    }

    override fun getTitle(): String {
        return when (this) {
            SelectVendor -> "Biller"
            SelectUsers -> "Payers"
            SelectSharingModel -> "Split It Up"
            SelectAccount -> "Account"
            Review -> "Review"
        }
    }

    override fun getPreviousStep(): ProgressStepperDescriptor? {
        return when (this) {
            SelectVendor -> null
            SelectUsers -> SelectVendor
            SelectSharingModel -> SelectUsers
            SelectAccount -> SelectSharingModel
            Review -> SelectAccount
        }
    }

    override fun getNextStep(): ProgressStepperDescriptor? {
        return when (this) {
            SelectVendor -> SelectUsers
            SelectUsers -> SelectSharingModel
            SelectSharingModel -> SelectAccount
            SelectAccount -> Review
            Review -> null
        }
    }
}

enum class ScheduledPaymentStep(private val index: Int) : ProgressStepperDescriptor {
    SelectFrequency(1),
    SelectStartDate(2),
    SelectEndDate(3),
    SelectUsers(4),
    SelectAmounts(5),
    SelectAccount(6),
    Review(7);

    override fun getSteps(): List<ProgressStepperDescriptor> {
        return values().asList().filter { it != SelectAmounts }
    }

    override fun getStepIndex(): Int {
        return index
    }

    override fun getTitle(): String {
        return when (this) {
            SelectFrequency -> "Frequency"
            SelectStartDate -> "Starting"
            SelectEndDate -> "Ending"
            SelectUsers -> "Payers"
            SelectAmounts -> "Payers"
            SelectAccount -> "Account"
            Review -> "Review"
        }
    }

    override fun getPreviousStep(): ProgressStepperDescriptor? {
        return when (this) {
            SelectFrequency -> null
            SelectStartDate -> SelectFrequency
            SelectEndDate -> SelectStartDate
            SelectUsers -> SelectEndDate
            SelectAmounts -> SelectUsers
            SelectAccount -> SelectAmounts
            Review -> SelectAccount
        }
    }

    override fun getNextStep(): ProgressStepperDescriptor? {
        return when (this) {
            SelectFrequency -> SelectStartDate
            SelectStartDate -> SelectEndDate
            SelectEndDate -> SelectUsers
            SelectUsers -> SelectAmounts
            SelectAmounts -> SelectAccount
            SelectAccount -> Review
            Review -> null
        }
    }
}
