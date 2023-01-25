
module "test_photo_bucket" {
  source = "./modules/s3"
  bucket_name = "test-equater-photos"
}

module "s3_public_read_write_bucket" {
  source = "./modules/s3"
  bucket_name = "test-equater-vendor-assets"
}
