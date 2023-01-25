use fake::uuid::UUIDv5;
use fake::{Dummy, Fake};
use serde::Deserialize;

#[derive(Debug, Deserialize, Dummy)]
#[serde(rename_all = "camelCase")]
pub struct Vendor {
    pub id: u32,
    #[dummy(faker = "UUIDv5")]
    pub uuid: String,
    pub ppd_id: Option<String>,
    pub date_time_added: Option<String>,    //iso date
    pub date_time_modified: Option<String>, //iso date
    pub total_number_of_expense_sharing_agreements: u32,
    pub has_been_reviewed_internally: bool,
    pub vendor_identity_cannot_be_determined: bool,
    pub friendly_name: String,
    pub logo_s3_bucket: Option<String>,
    pub logo_s3_key: Option<String>,
    pub logo_url: Option<String>,
    pub logo_upload_completed: bool,
    pub logo_sha256_hash: Option<String>,
}

#[derive(Debug, Deserialize, Dummy)]
#[serde(rename_all = "camelCase")]
pub struct VendorResponse {
    pub vendors: Vec<Vendor>,
}
