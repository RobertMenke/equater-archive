use std::env;

use async_recursion::async_recursion;
use authentication::authentication_api::{AuthenticationApi, SignInStrategy};
use authentication::authentication_controller::AuthenticationController;
use database::connection::connect;
use database::repository::user_repository::UserRepository;
use dotenv::dotenv;
use fetch_users::fetch_user_api::FetchUsersApi;
use fetch_users::fetch_users_command::FetchUsersCommand;
use fetch_vendors::fetch_vendors_api::FetchVendorsApi;
use fetch_vendors::fetch_vendors_command::FetchVendorsCommand;

use crate::commands::Command;
use crate::commands::FetchCommand;

mod authentication;
mod commands;
mod fetch_users;
mod fetch_vendors;
pub mod flag_command;
#[cfg(test)]
mod test_common;
mod user;
pub mod vendor;

#[tokio::main]
async fn main() -> Result<(), String> {
    dotenv().ok();
    let args: Vec<String> = env::args().collect();
    let command = parse_input(&args);
    // TODO: Revisit when async closures are stable
    let result = match command {
        Ok(cmd) => Ok(execute_command(&cmd).await),
        Err(err) => Err(err),
    };

    match result {
        Ok(future) => match future {
            Ok(success) => {
                println!("{}", success);
                Ok(())
            }
            Err(err) => {
                println!("{}", err);
                Err(err)
            }
        },
        Err(err) => {
            println!("{}", err);
            Err(err)
        }
    }
}

fn parse_input(input: &Vec<String>) -> Result<Command, String> {
    if input.len() == 1 {
        println!("Welcome to the Equater CLI. Since you didn't pass a command the --help (-h) menu will be displayed");
        return Err(String::from(Command::make_help_menu()));
    }

    Ok(Command::from(input)?)
}

#[async_recursion(?Send)]
async fn execute_command(command: &Command) -> Result<String, String> {
    let database_connection = connect().get().unwrap();
    let local_user_repository = UserRepository::new(&database_connection);
    let client = reqwest::Client::new();

    match command {
        Command::Login => {
            let remote_repository = AuthenticationApi::new(client);
            let controller =
                AuthenticationController::new(&local_user_repository, remote_repository);
            let response = controller.sign_in(SignInStrategy::CommandLineInput).await?;

            Ok(format!("{} is signed in", response.email))
        }
        Command::Logout => {
            match local_user_repository.truncate() {
                Ok(_rows_deleted) => Ok(String::from("You are now signed out of the CLI")),
                Err(err) => Err(format!("Error signing out: {}", err)),
            }
        }
        Command::Fetch(subcommand) => {
            let remote_repository = AuthenticationApi::new(client);
            let controller =
                AuthenticationController::new(&local_user_repository, remote_repository);
            if let Ok(local_user) = &controller.find_and_verify_local_user().await {
                match subcommand {
                    FetchCommand::Users(search_term) => {
                        let client = reqwest::Client::new();
                        let fetch_users_repository = FetchUsersApi::new(client);
                        let executor = FetchUsersCommand::new(fetch_users_repository);
                        executor.fetch_and_show_users(local_user, search_term).await;

                        Ok(String::from(""))
                    }
                    FetchCommand::Vendors(flag_command) => {
                        let client = reqwest::Client::new();
                        let fetch_vendor_repository = FetchVendorsApi::new(client);
                        let executor = FetchVendorsCommand::new(fetch_vendor_repository);
                        executor
                            .fetch_and_show_vendors(local_user, flag_command)
                            .await;

                        Ok(String::from(""))
                    }
                }
            } else {
                // prevent an unnecessary duplicate request to the server to verify the auth token that's already been
                // unverified by truncating the local user
                let _ = local_user_repository.truncate();
                execute_command(&Command::Login).await
            }
        }
        Command::Help => {
            Ok(String::from(Command::make_help_menu()))
        }
    }
}
