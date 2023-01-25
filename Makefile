# Default target
.DEFAULT_GOAL := check

# Make one-item-per-line work 
NULL :=

# Get the absolute path to the repository
EQUATER_GIT_ROOT := $(shell git rev-parse --show-toplevel)
EQUATER_NODE_VERSION := 16.13.1

###############################################
# Run targets
###############################################
run/dev/api:
	cd $(EQUATER_GIT_ROOT)/equater-api && npm run start:dev

run/dev/web:
	cd $(EQUATER_GIT_ROOT)/equater-web && npm run dev

run/dev/docker:
	cd $(EQUATER_GIT_ROOT) && docker compose up

run/dev/ngrok:
	ngrok start equater-api equater-web-client

# Should only be used for troubleshooting containers
run/dev/web/docker-local:
	cd $(EQUATER_GIT_ROOT)/equater-web && docker run --env-file .env.local -p 127.0.0.1:3000:3000 web

# Should only be used for troubleshooting containers
run/dev/api/docker-local:
	cd $(EQUATER_GIT_ROOT)/equater-api && docker run --env-file .env -p 127.0.0.1:3001:3000 api

###############################################
# Deploy targets
###############################################
deploy/staging/web:
	git push heroku/web/staging main

deploy/prod/web:
	git push heroku/web/prod main

deploy/staging/api:
	git push heroku/api/staging main

deploy/prod/api:
	git push heroku/api/prod main


###############################################
# Bootstrap targets (mac-only for now)
###############################################
bootstrap: bootstrap/install bootstrap/ios bootstrap/api bootstrap/web build/android

bootstrap/install:
	echo "Installing cocoapods..."
	$(install/cocoapods)
	echo "Cocoapods was installed"
	echo "Installing homebrew"
	$(install/homebrew)
	echo "Homebrew was installed"
	echo "Installing swiftformat"
	$(install/swiftformat)
	echo "swiftformat was installed"
	echo "Installing npm"
	$(install/npm)
	echo "npm was installed"
	echo "Next steps: Install ngrok, docker, setup .env files for web + api, setup .xcconfig files for ios, an set up ~/.gradle/gradle.properties for android."

install/homebrew:
	command -v brew || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

install/cocoapods:
	command -v pod || sudo gem install cocoapods

install/swiftformat:
	command -v swiftformat || brew install swiftformat

install/npm:
	command -v nvm || curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
	command -v npm || nvm install $(EQUATER_NODE_VERSION) && nvm use $(EQUATER_NODE_VERSION)

install/ktlint:
	command -v ktlint || brew install ktlint

bootstrap/ios:
	cd $(EQUATER_GIT_ROOT)/equater-ios pod-install --repo-update && cd $(EQUATER_GIT_ROOT)
	cd $(EQUATER_GIT_ROOT)

# TODO: .env file
bootstrap/api:
	cd $(EQUATER_GIT_ROOT)/equater-api && npm i
	docker compose up -d
	cd terraform && terraform init && terraform apply -auto-approve

# TODO: .env file
bootstrap/web:
	cd $(EQUATER_GIT_ROOT)/equater-web && npm i

###############################################
# Build targets
###############################################

build/api: 
	cd $(EQUATER_GIT_ROOT)/equater-api && \
	npm run build && \
	cd $(EQUATER_GIT_ROOT)

build/web:
	cd $(EQUATER_GIT_ROOT)/equater-web && \
	npm run build && \
	cd $(EQUATER_GIT_ROOT)

build/ios:
	cd $(EQUATER_GIT_ROOT)/equater-ios && \
	xcodebuild -scheme "Equater" build && \
	cd $(EQUATER_GIT_ROOT)

# Note: Must have JAVA_HOME set to a Java 11 runtime
build/android:
	cd $(EQUATER_GIT_ROOT)/equater-android && \
	./gradlew build

build/cli:
	cd $(EQUATER_GIT_ROOT)/equater-cli && \
	cargo b && \
	cd $(EQUATER_GIT_ROOT)

clean/api:
	cd $(EQUATER_GIT_ROOT)/equater-api && \
	npm run clean && \
	cd $(EQUATER_GIT_ROOT)

clean/web:
	cd $(EQUATER_GIT_ROOT)/equater-web && \
	npm run clean && \
	cd $(EQUATER_GIT_ROOT)

clean/ios:
	cd $(EQUATER_GIT_ROOT)/equater-ios && \
	xcodebuild -scheme "Equater" clean && \
	cd $(EQUATER_GIT_ROOT)

clean/android:
	cd $(EQUATER_GIT_ROOT)/equater-android && \
	./gradlew clean && \
	cd $(EQUATER_GIT_ROOT)

clean/cli:
	cd $(EQUATER_GIT_ROOT)/equater-cli && \
	cargo clean && \
	cd $(EQUATER_GIT_ROOT)

###############################################
# Test targets
###############################################

test/api: 
	cd $(EQUATER_GIT_ROOT)/equater-api && \
	npm test && \
	cd $(EQUATER_GIT_ROOT)

###############################################
# Format targets
###############################################

format: format/api format/web format/ios format/android

format/api:
	npx --yes prettier --write $(EQUATER_GIT_ROOT)/equater-api/src/**/*.ts

format/web:
	npx --yes prettier --write "$(EQUATER_GIT_ROOT)/equater-web/components/**/*.ts"
	npx prettier --write "$(EQUATER_GIT_ROOT)/equater-web/constants/**/*.ts"
	npx prettier --write "$(EQUATER_GIT_ROOT)/equater-web/hooks/**/*.ts"
	npx prettier --write "$(EQUATER_GIT_ROOT)/equater-web/redux/**/*.ts"
	npx prettier --write "$(EQUATER_GIT_ROOT)/equater-web/services/**/*.ts"
	npx prettier --write "$(EQUATER_GIT_ROOT)/equater-web/types/**/*.ts"
	npx prettier --write "$(EQUATER_GIT_ROOT)/equater-web/utils/**/*.ts"

format/ios:
	swiftformat $(EQUATER_GIT_ROOT)/equater-ios/.

format/android:
	cd $(EQUATER_GIT_ROOT)/equater-android && \
	./gradlew ktlintFormat -p $(EQUATER_GIT_ROOT)/equater-android

format/cli:
	cd $(EQUATER_GIT_ROOT)/equater-cli && \
	cargo fmt --all

###############################################
# Lint targets
###############################################
check: check/api check/web check/ios check/android check/cli

check/api:
	npx --yes prettier --check "$(EQUATER_GIT_ROOT)/equater-api/src/**/*.ts"
	$(build/api)

check/web:
	npx --yes prettier --check "$(EQUATER_GIT_ROOT)/equater-web/components/**/*.ts"
	npx prettier --check "$(EQUATER_GIT_ROOT)/equater-web/constants/**/*.ts"
	npx prettier --check "$(EQUATER_GIT_ROOT)/equater-web/hooks/**/*.ts"
	npx prettier --check "$(EQUATER_GIT_ROOT)/equater-web/redux/**/*.ts"
	npx prettier --check "$(EQUATER_GIT_ROOT)/equater-web/services/**/*.ts"
	npx prettier --check "$(EQUATER_GIT_ROOT)/equater-web/types/**/*.ts"
	npx prettier --check "$(EQUATER_GIT_ROOT)/equater-web/utils/**/*.ts"
	$(build/web)

# TODO: Get iOS build working in CI
check/ios:
	swiftformat --lint equater-ios/Equater
	# build/ios

check/android:
	cd $(EQUATER_GIT_ROOT)/equater-android && ./gradlew ktlint
	$(build/android)

check/cli:
	cd $(EQUATER_GIT_ROOT)/equater-cli && \
	cargo clippy --all-features --all-targets --all && \
	cd $(EQUATER_GIT_ROOT)
	$(build/cli)

###############################################
# Update targets
###############################################
update/rust:
	rustup update stable
