output "s3_arn" {
  value = aws_s3_bucket.photos_bucket.arn
}

output "bucket_name" {
  value = aws_s3_bucket.photos_bucket.bucket
}
