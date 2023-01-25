import { Controller, Get, Head } from '@nestjs/common'
import { ConfigService, Environment } from '../config/config.service'

@Controller()
export class AppController {
    constructor(private readonly configService: ConfigService) {}

    @Get('/')
    getRootMessage() {
        return `Hey friend 👋 this is our API server. If you're looking for the website, visit <a href="https://equater.app">https://equater.app</a>. The current time is ${Date.now()} in computer <3.`
    }

    @Head('/')
    healthCheck() {
        return ''
    }

    @Get('api/environment')
    getEnvironment() {
        return {
            plaidEnvironment: this.configService.get(Environment.PLAID_ENVIRONMENT),
            serverEnvironment: this.configService.get(Environment.SERVER_ENVIRONMENT)
        }
    }
}
