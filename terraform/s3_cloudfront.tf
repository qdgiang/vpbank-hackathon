# S3 bucket for static website hosting
resource "aws_s3_bucket" "client_website" {
  bucket = "${var.project_name}-client-website"
}

resource "aws_s3_bucket_public_access_block" "client_website" {
  bucket = aws_s3_bucket.client_website.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_website_configuration" "client_website" {
  bucket = aws_s3_bucket.client_website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}


# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "client_website" {
  name                              = "${var.project_name}-client-oac"
  description                       = "OAC for ${var.project_name} client website"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "client_website" {
  origin {
    domain_name              = aws_s3_bucket.client_website.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.client_website.id
    origin_id                = "S3-${aws_s3_bucket.client_website.id}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.client_website.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  # Custom error response for SPA routing
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "${var.project_name}-client-distribution"
  }
}

# Update S3 bucket policy to allow CloudFront access
resource "aws_s3_bucket_policy" "client_website_cloudfront" {
  bucket = aws_s3_bucket.client_website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipal"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.client_website.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.client_website.arn
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.client_website]
}