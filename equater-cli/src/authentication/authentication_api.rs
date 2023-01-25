use std::env;

use crate::user::{SignInResponse, User};
use async_trait::async_trait;
use dialoguer::{theme::ColorfulTheme, Input, Password};
use http::{header::AUTHORIZATION, HeaderMap, HeaderValue};
use reqwest::Result;
use serde::Serialize;

#[derive(Clone)]
pub enum SignInStrategy {
    CommandLineInput,
    /// Used in test only
    #[allow(dead_code)]
    StoredValues {
        email: String,
        password: String,
    },
}

#[derive(Serialize)]
pub struct SignInRequest {
    pub email: String,
    pub password: String,
}

#[async_trait]
pub trait RemoteAuthentication {
    async fn sign_in(&self, request: &SignInRequest) -> Result<SignInResponse>;
    async fn get_user(&self, auth_token: &str) -> Result<User>;
}

impl SignInRequest {
    pub fn new(strategy: SignInStrategy) -> Self {
        match strategy {
            SignInStrategy::CommandLineInput => Self::from_user_input(),
            SignInStrategy::StoredValues { email, password } => Self { email, password },
        }
    }

    pub fn from_user_input() -> Self {
        let email: String = Input::with_theme(&ColorfulTheme::default())
            .with_prompt("Email: ")
            .interact_text()
            .expect("Enter a valid email");

        let password: String = Password::with_theme(&ColorfulTheme::default())
            .with_prompt("Password: ")
            .interact()
            .expect("Enter a valid password");

        Self { email, password }
    }
}

pub struct AuthenticationApi {
    client: reqwest::Client,
}

impl AuthenticationApi {
    pub fn new(client: reqwest::Client) -> Self {
        AuthenticationApi { client }
    }
}

#[async_trait]
impl RemoteAuthentication for AuthenticationApi {
    async fn sign_in(&self, request: &SignInRequest) -> Result<SignInResponse> {
        let api_base = env::var("EQUATER_API_BASE").expect("EQUATER_API_BASE must be set");
        let url = format!("{}/api/auth/admin-login", api_base);
        let response = self.client.post(url).json(&request).send().await?;

        return response.json::<SignInResponse>().await;
    }

    async fn get_user(&self, auth_token: &str) -> Result<User> {
        let api_base = env::var("EQUATER_API_BASE").expect("EQUATER_API_BASE must be set");
        let url = format!("{}/api/user", api_base);
        let mut header_map = HeaderMap::new();
        let header_token =
            HeaderValue::from_str(format!("Bearer {}", auth_token).as_str()).unwrap();
        header_map.insert(AUTHORIZATION, header_token);
        let response = self.client.get(url).headers(header_map).send().await?;

        return response.json::<User>().await;
    }
}
