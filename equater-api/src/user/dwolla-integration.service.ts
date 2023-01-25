import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { AuthGetResponse, NumbersACH } from 'plaid'
import { DwollaService } from '../dwolla/dwolla.service'
import { Balance, DwollaCustomer, DwollaFundingSource, DwollaFundingSourceDto } from '../dwolla/dwolla.types'
import { PlaidService } from '../plaid/plaid.service'
import { UserAccount } from '../user_account/user-account.entity'
import { UserAccountService } from '../user_account/user-account.service'
import { DwollaCustomerStatus, User } from './user.entity'
import { UserService } from './user.service'

@Injectable()
export class DwollaIntegrationService {
    private readonly logger = new Logger(DwollaIntegrationService.name)
    constructor(
        private readonly dwollaService: DwollaService,
        private readonly plaidService: PlaidService,
        private readonly userService: UserService,
        private readonly accountService: UserAccountService
    ) {}

    async createOrUpdateCustomer(user: User): Promise<User> {
        if (user.dwollaCustomerUrl) {
            return await this.updateCustomer(user)
        }

        const response = await this.dwollaService.createCustomer(user)
        const location = response.headers.get('location')
        const id = location.split('/').pop()
        user = await this.userService.setDwollaCustomer(user, location, id)
        const customer = await this.dwollaService.getCustomer(user)
        const type = customer.status === 'verified' ? DwollaCustomerStatus.VERIFIED : DwollaCustomerStatus.UNVERIFIED

        return await this.userService.setDwollaCustomerStatus(user, type)
    }

    private async updateCustomer(user: User): Promise<User> {
        await this.dwollaService.updateDwollaCustomer(user)
        const customer = await this.dwollaService.getCustomer(user)
        const type = customer.status === 'verified' ? DwollaCustomerStatus.VERIFIED : DwollaCustomerStatus.UNVERIFIED

        return await this.userService.updateDwollaCustomer(user, user.dwollaCustomerUrl, user.dwollaCustomerId, type)
    }

    async deactivateCustomer(user: User): Promise<void> {
        await this.dwollaService.deactivateCustomer(user)
    }

    getCustomer(user: User): Promise<DwollaCustomer> {
        return this.dwollaService.getCustomer(user)
    }

    getCustomerBalance(user: User): Promise<Balance[]> {
        return this.dwollaService.getCustomerBalance(user)
    }

    getFundingSources(user: User): Promise<DwollaFundingSource[]> {
        return this.dwollaService.getFundingSources(user)
    }

    getTransfers(user: User) {
        return this.dwollaService.getTransfers(user)
    }

    async removeFundingSource(account: UserAccount) {
        await this.dwollaService.removeFundingSource(account)
        await this.accountService.removeFundingSource(account)
    }

    /**
     * Assume that the funding source has been created already if account.dwollaFundingSourceUrl
     * already exists on the record.
     *
     * @param user
     * @param account
     */
    async createFundingSource(user: User, account: UserAccount): Promise<UserAccount> {
        if (account.dwollaFundingSourceUrl) {
            return account
        }

        const { processor_token } = await this.plaidService.getDwollaProcessorToken(account)
        const routingInfo = await this.plaidService.getRoutingInfo(account)
        const ach = this.findActiveAch(account, routingInfo)
        const fundingSourceDto: DwollaFundingSourceDto = {
            routingNumber: ach.routing,
            accountNumber: ach.account,
            bankAccountType: account.accountType,
            name: `${account.institutionName} - ${account.accountName}`,
            plaidToken: processor_token
        }

        const fundingSource = await this.dwollaService.createFundingSource(user, fundingSourceDto)

        return await this.accountService.setDwollaFundingSource(account, fundingSource)
    }

    getFundingSource(account: UserAccount): Promise<DwollaFundingSource> {
        return this.dwollaService.getFundingSource(account)
    }

    private findActiveAch(account: UserAccount, auth: AuthGetResponse): NumbersACH {
        const ach = auth.numbers.ach.find((ach) => ach.account_id === account.accountId)

        if (!ach) {
            throw new HttpException(
                `Unable to create funding source. Active account is not a valid funding source.`,
                HttpStatus.UNPROCESSABLE_ENTITY
            )
        }

        return ach
    }
}
