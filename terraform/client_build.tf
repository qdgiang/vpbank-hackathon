# Build and deploy client to S3
resource "null_resource" "client_build" {
  triggers = {
    # Rebuild when client source changes
    client_hash = filemd5("${path.module}/../client/package.json")
  }

  provisioner "local-exec" {
    command = "cd ${path.module}/../client && npm install && env VITE_API_URL=http://${aws_lb.vpbank_server.dns_name} npm run build"
  }
}

# Upload client build to S3 using AWS CLI
resource "null_resource" "client_upload" {
  triggers = {
    client_build = null_resource.client_build.id
  }

  provisioner "local-exec" {
    command = "aws s3 sync ${path.module}/../client/dist/ s3://${aws_s3_bucket.client_website.bucket}/ --delete"
  }

  depends_on = [null_resource.client_build]
}

# Invalidate CloudFront cache after deployment
resource "null_resource" "cloudfront_invalidation" {
  triggers = {
    client_files = filemd5("${path.module}/../client/package.json")
  }

  provisioner "local-exec" {
    command = "aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.client_website.id} --paths '/*'"
  }

  depends_on = [null_resource.client_upload]
}