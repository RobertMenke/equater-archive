use crate::user::User;
use async_trait::async_trait;
use database::models::user::LocalUser;
use fake::Fake;
use fake::Faker;
use http::response;
use reqwest::Result;

use super::fetch_users_command::FetchesUsers;

pub struct FetchUserApiFake {
    pub should_error: bool,
}

#[async_trait]
impl FetchesUsers for FetchUserApiFake {
    async fn fetch_users(&self, _local_user: &LocalUser, _search_term: &str) -> Result<Vec<User>> {
        if self.should_error {
            let mut builder = response::Builder::new();
            builder = builder.status(403);
            let body = r#"{
                 "error": "Unauthorized",
            }"#;

            // reqwest supports converting an http::response::Response into a reqwest::Response
            let response: reqwest::Response = builder.body(body).unwrap().into();

            return response.json().await;
        }

        let response: Vec<User> = Faker.fake();

        return Ok(response);
    }
}
