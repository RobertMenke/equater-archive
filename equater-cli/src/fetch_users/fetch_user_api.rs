use std::env;

use crate::user::User;
use async_trait::async_trait;
use database::models::user::LocalUser;
use http::{header::AUTHORIZATION, HeaderMap, HeaderValue};
use reqwest::Result;

use super::{fetch_users_command::FetchesUsers, fetch_users_response::FetchUsersResponse};

pub struct FetchUsersApi {
    client: reqwest::Client,
}

impl FetchUsersApi {
    pub fn new(client: reqwest::Client) -> Self {
        Self { client }
    }
}

#[async_trait]
impl FetchesUsers for FetchUsersApi {
    async fn fetch_users(&self, local_user: &LocalUser, search_term: &str) -> Result<Vec<User>> {
        let api_base = env::var("EQUATER_API_BASE").expect("EQUATER_API_BASE must be set");
        let url = format!(
            "{}/api/user/search?searchTerm={}&includeAuthenticatedUser={}",
            api_base, search_term, "true"
        );
        let mut header_map = HeaderMap::new();
        let header_token =
            HeaderValue::from_str(format!("Bearer {}", local_user.get_auth_token()).as_str())
                .unwrap();
        header_map.insert(AUTHORIZATION, header_token);
        let response = self.client.get(url).headers(header_map).send().await?;
        let mut fetch_users_response = response.json::<FetchUsersResponse>().await?;

        return Ok(fetch_users_response.move_to_single_list());
    }
}
