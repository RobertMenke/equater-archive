use std::env;

use crate::vendor::{Vendor, VendorResponse};
use async_trait::async_trait;
use database::models::user::LocalUser;
use http::{header::AUTHORIZATION, HeaderMap, HeaderValue};
use reqwest::Result;

use super::fetch_vendors_command::FetchesVendors;

pub struct FetchVendorsApi {
    client: reqwest::Client,
}

impl FetchVendorsApi {
    pub fn new(client: reqwest::Client) -> Self {
        Self { client }
    }
}

#[async_trait]
impl FetchesVendors for FetchVendorsApi {
    async fn search_vendors(
        &self,
        local_user: &LocalUser,
        search_term: &str,
    ) -> Result<Vec<Vendor>> {
        let api_base = env::var("EQUATER_API_BASE").expect("EQUATER_API_BASE must be set");
        let url = format!(
            "{}/api/vendor/search?searchTerm={}&requiringInternalReview={}",
            api_base, search_term, "false"
        );
        let mut header_map = HeaderMap::new();
        let header_token =
            HeaderValue::from_str(format!("Bearer {}", local_user.get_auth_token()).as_str())
                .unwrap();
        header_map.insert(AUTHORIZATION, header_token);
        let response = self.client.get(url).headers(header_map).send().await?;
        let fetch_vendor_response = response.json::<VendorResponse>().await?;

        return Ok(fetch_vendor_response.vendors);
    }

    async fn fetch_popular_vendors(&self, local_user: &LocalUser) -> Result<Vec<Vendor>> {
        let api_base = env::var("EQUATER_API_BASE").expect("EQUATER_API_BASE must be set");
        let url = format!("{}/api/vendor/popular", api_base);
        let mut header_map = HeaderMap::new();
        let header_token =
            HeaderValue::from_str(format!("Bearer {}", local_user.get_auth_token()).as_str())
                .unwrap();
        header_map.insert(AUTHORIZATION, header_token);
        let response = self.client.get(url).headers(header_map).send().await?;
        let fetch_vendor_response = response.json::<VendorResponse>().await?;

        return Ok(fetch_vendor_response.vendors);
    }

    async fn fetch_vendors_that_require_review(
        &self,
        local_user: &LocalUser,
    ) -> Result<Vec<Vendor>> {
        let api_base = env::var("EQUATER_API_BASE").expect("EQUATER_API_BASE must be set");
        let url = format!("{}/api/vendor/requires-internal-review", api_base);
        let mut header_map = HeaderMap::new();
        let header_token =
            HeaderValue::from_str(format!("Bearer {}", local_user.get_auth_token()).as_str())
                .unwrap();
        header_map.insert(AUTHORIZATION, header_token);
        let response = self.client.get(url).headers(header_map).send().await?;
        let fetch_vendor_response = response.json::<VendorResponse>().await?;

        return Ok(fetch_vendor_response.vendors);
    }
}
