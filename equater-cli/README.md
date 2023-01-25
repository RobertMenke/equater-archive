## About

At this time, this project is not intended to be particularly functional. It's primary purpose was to learn Rust while preparing for a new job.

## Set Up

```bash
mkdir -p ~/Projects/Equater/cli
git clone git@github.com:RobertMenke/equater-cli.git ~/Projects/Equater/cli
cd ~/Projects/Equater/cli
mkdir -p ~/.local/share/Equater
touch ~/.local/share/Equater/equater_cli.db
touch .env .test.env
echo "EQUATER_API_BASE=https://subdomain.ngrok.io" > .env
echo "EQUATER_LOCAL_DATABASE_URL=file:$HOME/.local/share/Equater/equater_cli.db" > .env
echo "EQUATER_API_BASE=https://subdomain.ngrok.io" > .test.env
echo "EQUATER_LOCAL_DATABASE_URL=file:$HOME/.local/share/Equater/equater_cli.db" > .test.env
```

## Building

```bash
cargo build --release
```

(optional) symlink to /usr/local/bin

```bash
ln -s $HOME/Projects/Equater/cli/target/release/equater /usr/local/bin/equater
```

From your .zshrc or equivalent export the production versions of these environment variables.

Example:

~/.oh-my-zsh/custom/exports.zsh

```bash
# Equater CLI
export EQUATER_API_BASE=https://www.equater.io
export EQUATER_LOCAL_DATABASE_URL=file:$HOME/.local/share/Equater/equater_cli.db
```

## Usage

Logging in
```bash
# Only admins can use the CLI, so you must be an admin to use this command
equater login
```

Logging out
```bash
equater logout
```

Searching for users
```bash
equater fetch users --search robert
```

Searching for approved vendors
```bash
equater fetch vendors --search netflix
```

Find new vendors that require manual review
```bash
equater fetch vendors --review-required
```

List the most popular vendors (in terms of most bills split)
```bash
equater fetch vendors --popular
```
