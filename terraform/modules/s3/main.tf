// TODO: Make the ACL more realistic. For now, in order to move quickly I'm making it public locally.
resource "aws_s3_bucket" "photos_bucket" {
  bucket = var.bucket_name
  acl = "public-read-write"
}
