use async_trait::async_trait;

use crate::vendor::{Vendor, VendorResponse};
use database::models::user::LocalUser;
use fake::{Fake, Faker};
use http::response;
use reqwest::Result;

use super::fetch_vendors_command::FetchesVendors;

pub struct FetchVendorsApiFake {
    should_error: bool,
}

#[async_trait]
impl FetchesVendors for FetchVendorsApiFake {
    async fn search_vendors(
        &self,
        _local_user: &LocalUser,
        _search_term: &str,
    ) -> Result<Vec<Vendor>> {
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

        let response: VendorResponse = Faker.fake();

        return Ok(response.vendors);
    }

    async fn fetch_popular_vendors(&self, _local_user: &LocalUser) -> Result<Vec<Vendor>> {
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

        let response: VendorResponse = Faker.fake();

        return Ok(response.vendors);
    }

    async fn fetch_vendors_that_require_review(
        &self,
        _local_user: &LocalUser,
    ) -> Result<Vec<Vendor>> {
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

        let response: VendorResponse = Faker.fake();

        return Ok(response.vendors);
    }
}
