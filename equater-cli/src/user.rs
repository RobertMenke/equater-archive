use fake::{faker::internet::en::SafeEmail, uuid::UUIDv5};
use fake::{Dummy, Fake};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Dummy)]
#[serde(rename_all = "camelCase")]
pub struct SignInResponse {
    pub auth_token: String,
    pub user: User,
    pub user_accounts: Vec<UserAccount>,
}

#[derive(Debug, Deserialize, Serialize, Dummy)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: u32,
    #[dummy(faker = "UUIDv5")]
    pub uuid: String,
    #[dummy(faker = "SafeEmail()")]
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub email_is_confirmed: bool,
    pub can_receive_funds: bool,
    pub profile_photo_url: Option<String>,
    pub profile_photo_upload_completed: bool,
    pub profile_photo_sha256_hash: Option<String>,
    pub cover_photo_upload_completed: bool,
    pub cover_photo_sha256_hash: Option<String>,
    pub date_time_created: String,
    pub address_one: Option<String>,
    pub address_two: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub postal_code: Option<String>,
    pub pre_signed_photo_download_url: Option<String>,
    pub pre_signed_cover_photo_download_url: Option<String>,
    #[serde(default)]
    pub accepted_terms_of_service: bool,
    #[serde(default)]
    pub accepted_privacy_policy: bool,
    #[serde(default)]
    pub link_tokens: Vec<PlaidLinkToken>,
    #[serde(default)]
    pub dwolla_reverification_needed: bool,
}

#[derive(Debug, Deserialize, Serialize, Dummy)]
#[serde(rename_all = "camelCase")]
pub struct PlaidLinkToken {
    pub id: u32,
    pub user_id: u32,
    pub user_account_id: Option<u32>,
    pub token_type: PlaidTokenType,
    pub plaid_link_token: String,
    /// ISO8601 String
    pub date_time_token_created: String,
    /// ISO8601 String
    pub date_time_token_expires: String,
}

#[derive(Debug, Deserialize, Serialize, Dummy)]
pub enum PlaidTokenType {
    #[serde(rename = "DEPOSITORY_ONLY")]
    DepositoryOnly,
    #[serde(rename = "CREDIT_AND_DEPOSITORY")]
    CreditAndDepository,
    #[serde(rename = "ANDROID_DEPOSITORY_ONLY")]
    AndroidDepositoryOnly,
    #[serde(rename = "ANDROID_CREDIT_AND_DEPOSITORY")]
    AndroidCreditAndDepository,
    #[serde(rename = "ITEM_UPDATE")]
    ItemUpdate,
    #[serde(rename = "ANDROID_ITEM_UPDATE")]
    AndroidItemUpdate,
}

#[derive(Debug, Deserialize, Serialize, Dummy)]
#[serde(rename_all = "camelCase")]
pub struct UserAccount {
    pub id: u32,
    pub user_id: u32,
    pub account_id: String,
    pub account_name: String,
    pub account_sub_type: String,
    pub account_type: String,
    pub institution_id: String,
    pub institution_name: String,
    pub is_active: bool,
    pub has_removed_funding_source: bool,
    pub dwolla_funding_source_id: Option<String>,
    /// ISO8601 String,
    pub date_of_last_plaid_transaction_pull: Option<String>,
    pub requires_plaid_re_authentication: bool,
    pub institution: Institution,
    pub link_tokens: Vec<PlaidLinkToken>,
}

#[derive(Debug, Deserialize, Serialize, Dummy)]
#[serde(rename_all = "camelCase")]
pub struct Institution {
    pub id: u32,
    pub uuid: String,
    pub institution_id: String,
    pub name: String,
    pub website_url: String,
    pub primary_color_hex_code: String,
    pub logo_url: Option<String>,
    pub logo_sha256_hash: Option<String>,
}
