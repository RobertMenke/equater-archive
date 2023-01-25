
module "photo_bucket" {
  source = "./modules/s3"
  bucket_name = "equater-photos"
}

module "equater_vendor_assets" {
  source = "./modules/s3"
  bucket_name = "equater-vendor-assets"
}
