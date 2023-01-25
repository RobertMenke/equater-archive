use crate::user::User;
use async_trait::async_trait;
use database::models::user::LocalUser;
use reqwest::Result;

use super::fetch_users_ui::FetchUsersUi;

#[async_trait]
pub trait FetchesUsers {
    async fn fetch_users(&self, local_user: &LocalUser, search_term: &str) -> Result<Vec<User>>;
}

pub struct FetchUsersCommand<T: FetchesUsers> {
    remote_repository: T,
}

impl<T: FetchesUsers> FetchUsersCommand<T> {
    pub fn new(remote_repository: T) -> Self {
        Self { remote_repository }
    }

    pub async fn fetch_and_show_users(&self, local_user: &LocalUser, search_term: &str) {
        let maybe_users = self
            .remote_repository
            .fetch_users(local_user, search_term)
            .await;

        // TODO: Left off here - need to follow the tui-rs table example
        // https://github.com/fdehau/tui-rs/blob/v0.18.0/examples/table.rs
        // to render a table once we have a list of users
        if let Ok(users) = maybe_users {
            let ui = FetchUsersUi::new(users);
            match ui.render() {
                Ok(_) => { /*do nothing*/ }
                Err(err) => println!("{}", err),
            };
        } else {
            println!("no users")
        }
    }
}
