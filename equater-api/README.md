![Tests Status](https://github.com/RobertMenke/equater-api/actions/workflows/test.yml/badge.svg)

## Setup Guide

#### Prerequisites

- install node/npm
- install docker
- install terraform
- Set up ngrok
- Cloned repos for server, web, mobile (install dependencies as well via npm/gradle/cocoapods)

## Steps

- Provision ngrok tunnels for API server + web client
- Run `npm install`
- Run `cd terraform && terraform init && cd -`
- Run `./run.sh`
- Run `npm run localstack:setup`

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```


## Generating Symmetric Keys

Mac OSX:
```bash
openssl enc -aes-256-cbc -k replace-this-with-your-secret -P -md sha256
```

## Generate an RSA Keypair

```bash
openssl genrsa -out privkey.pem 2048
openssl rsa -in privkey.pem -pubout > key.pub
```
## Notes on Heroku Redis
As of version 6, Heroku requires that premium tier accounts connect via TLS. 
I have followed the direction provided here https://devcenter.heroku.com/articles/securing-heroku-redis to 
secure Heroku Redis 

## Resources
- https://github.com/plaid/plaid-node
- https://plaid.com/docs/
- https://shape.so/app/
- https://blog.logrocket.com/jwt-authentication-best-practices/

## Database migrations
`npm run typeorm -- migration:generate ./src/database_migrations/NameOfYourMigration`
