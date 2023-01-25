use async_trait::async_trait;
use reqwest::Result;

use fake::Fake;
use fake::Faker;
use http::response;

use crate::user::SignInResponse;
use crate::user::User;

use super::authentication_api::RemoteAuthentication;
use super::authentication_api::SignInRequest;

pub struct AuthenticationApiFake {
    pub should_error: bool,
}

#[async_trait]
impl RemoteAuthentication for AuthenticationApiFake {
    async fn sign_in(&self, _request: &SignInRequest) -> Result<SignInResponse> {
        // Loosely following this guide: https://write.as/balrogboogie/testing-reqwest-based-clients
        if self.should_error {
            let mut builder = response::Builder::new();
            builder = builder.status(401);
            let body = r#"{
                 "error": "Invalid username or password",
            }"#;

            // reqwest supports converting an http::response::Response into a reqwest::Response
            let response: reqwest::Response = builder.body(body).unwrap().into();

            return response.json().await;
        }

        let response: SignInResponse = Faker.fake();

        return Ok(response);
    }

    async fn get_user(&self, _auth_token: &str) -> Result<User> {
        if self.should_error {
            let mut builder = response::Builder::new();
            builder = builder.status(401);
            let body = r#"{
                 "error": "User session is not valid",
            }"#;

            // reqwest supports converting an http::response::Response into a reqwest::Response
            let response: reqwest::Response = builder.body(body).unwrap().into();

            return response.json().await;
        }

        let response: User = Faker.fake();

        return Ok(response);
    }
}
