use crate::{flag_command::FlagCommand, vendor::Vendor};
use async_trait::async_trait;
use database::models::user::LocalUser;
use reqwest::Result;

use super::fetch_vendors_ui::FetchVendorsUi;

#[async_trait]
pub trait FetchesVendors {
    async fn search_vendors(
        &self,
        local_user: &LocalUser,
        search_term: &str,
    ) -> Result<Vec<Vendor>>;
    async fn fetch_popular_vendors(&self, local_user: &LocalUser) -> Result<Vec<Vendor>>;
    async fn fetch_vendors_that_require_review(
        &self,
        local_user: &LocalUser,
    ) -> Result<Vec<Vendor>>;
}

enum FetchVendorOperationType {
    Search(String),
    ReviewRequired,
    Popular,
    Default,
}

pub struct FetchVendorsCommand<T: FetchesVendors> {
    remote_repository: T,
}

impl<T: FetchesVendors> FetchVendorsCommand<T> {
    pub fn new(remote_repository: T) -> Self {
        Self { remote_repository }
    }

    pub async fn fetch_and_show_vendors(&self, local_user: &LocalUser, flag_command: &FlagCommand) {
        if let Some(operation) = self.map_command_to_operation(flag_command) {
            let maybe_vendors = self.fetch_vendors(local_user, &operation).await;
            match maybe_vendors {
                Ok(vendors) => match FetchVendorsUi::new(vendors).render() {
                    Ok(_) => {}
                    Err(err) => println!("Error: {}", err),
                },
                Err(err) => {
                    println!("Error fetching vendors {}", err);
                }
            }
        } else {
            println!("Could not map those flags to a valid operation");
        }
    }

    async fn fetch_vendors(
        &self,
        local_user: &LocalUser,
        operation: &FetchVendorOperationType,
    ) -> Result<Vec<Vendor>> {
        match operation {
            FetchVendorOperationType::Search(search_term) => {
                self.remote_repository
                    .search_vendors(local_user, search_term)
                    .await
            }
            FetchVendorOperationType::ReviewRequired => {
                self.remote_repository
                    .fetch_vendors_that_require_review(local_user)
                    .await
            }
            FetchVendorOperationType::Popular => {
                self.remote_repository
                    .fetch_popular_vendors(local_user)
                    .await
            }
            FetchVendorOperationType::Default => {
                self.remote_repository
                    .fetch_popular_vendors(local_user)
                    .await
            }
        }
    }

    fn map_command_to_operation(
        &self,
        flag_command: &FlagCommand,
    ) -> Option<FetchVendorOperationType> {
        return flag_command
            .flag
            .as_ref()
            .map(|value| match value.as_ref() {
                "--review-required" => FetchVendorOperationType::ReviewRequired,
                "--search" => {
                    let search_term = &flag_command.value;
                    match &search_term {
                        Some(term) => FetchVendorOperationType::Search(String::from(term)),
                        None => FetchVendorOperationType::Default,
                    }
                }
                "--popular" => FetchVendorOperationType::Popular,
                _ => FetchVendorOperationType::Default,
            });
    }
}
