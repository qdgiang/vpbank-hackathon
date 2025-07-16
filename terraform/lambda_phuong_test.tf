# --- Resources for phuong_test Lambda ---

# Lambda layer for phuong_test function
resource "null_resource" "phuong_test_lambda_layer" {
  triggers = {
    requirements = filemd5("${path.module}/../lambda/phuong_test/requirements.txt")
  }

  provisioner "local-exec" {
    command = <<EOF
      rm -rf ${path.module}/../lambda/phuong_test/layer
      mkdir -p ${path.module}/../lambda/phuong_test/layer/python
      pip install -r ${path.module}/../lambda/phuong_test/requirements.txt -t ${path.module}/../lambda/phuong_test/layer/python
    EOF
  }
}

data "archive_file" "phuong_test_lambda_layer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/phuong_test/layer"
  output_path = "${path.module}/../lambda/phuong_test/lambda-layer.zip"
  excludes    = ["**/__pycache__/**"]

  depends_on = [null_resource.phuong_test_lambda_layer]
}

resource "aws_lambda_layer_version" "phuong_test_layer" {
  filename            = data.archive_file.phuong_test_lambda_layer_zip.output_path
  layer_name          = "${var.project_name}-phuong-test-layer"
  compatible_runtimes = [var.python_runtime]
  source_code_hash    = data.archive_file.phuong_test_lambda_layer_zip.output_base64sha256
}

# Null resource to control lambda updates based on source file changes
resource "null_resource" "phuong_test_lambda_source_hash" {
  triggers = {
    source_code_hash = md5(join("", [
      for f in fileset("${path.module}/../lambda/phuong_test", "*.py") :
      filemd5("${path.module}/../lambda/phuong_test/${f}")
    ]))
  }
}

# Lambda function code archive
data "archive_file" "phuong_test_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/phuong_test"
  output_path = "${path.module}/../lambda/phuong_test/lambda.zip"
  excludes    = ["requirements.txt", "layer/", ".env", "test.ipynb"]
}

# S3 bucket for phuong_test lambda (optional, for testing)
resource "aws_s3_bucket" "phuong_test_bucket" {
  bucket = "${var.project_name}-phuong-test-bucket"
}

# IAM role for phuong_test lambda
resource "aws_iam_role" "phuong_test_lambda_role" {
  name = "${var.project_name}-phuong-test-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Basic execution policy for Lambda
resource "aws_iam_role_policy_attachment" "phuong_test_lambda_policy" {
  role       = aws_iam_role.phuong_test_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# S3 access policy for phuong_test lambda
resource "aws_iam_policy" "phuong_test_s3_policy" {
  name        = "${var.project_name}-phuong-test-s3-policy"
  description = "Policy to allow phuong_test lambda to interact with S3"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ],
        Resource = [
          aws_s3_bucket.phuong_test_bucket.arn,
          "${aws_s3_bucket.phuong_test_bucket.arn}/*",
          "arn:aws:s3:::*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "phuong_test_s3_attachment" {
  role       = aws_iam_role.phuong_test_lambda_role.name
  policy_arn = aws_iam_policy.phuong_test_s3_policy.arn
}

# SageMaker access policy for phuong_test lambda
resource "aws_iam_policy" "phuong_test_sagemaker_policy" {
  name        = "${var.project_name}-phuong-test-sagemaker-policy"
  description = "Policy to allow phuong_test lambda to interact with SageMaker"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "sagemaker:CreateEndpoint",
          "sagemaker:CreateEndpointConfig",
          "sagemaker:CreateModel",
          "sagemaker:DeleteEndpoint",
          "sagemaker:DeleteEndpointConfig",
          "sagemaker:DeleteModel",
          "sagemaker:DescribeEndpoint",
          "sagemaker:DescribeEndpointConfig",
          "sagemaker:DescribeModel",
          "sagemaker:InvokeEndpoint",
          "sagemaker:ListEndpoints",
          "sagemaker:ListModels",
          "sagemaker:UpdateEndpoint",
          "sagemaker:CreateTrainingJob",
          "sagemaker:DescribeTrainingJob",
          "sagemaker:ListTrainingJobs",
          "sagemaker:StopTrainingJob"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "phuong_test_sagemaker_attachment" {
  role       = aws_iam_role.phuong_test_lambda_role.name
  policy_arn = aws_iam_policy.phuong_test_sagemaker_policy.arn
}

# Lambda function
resource "aws_lambda_function" "phuong_test" {
  function_name = "${var.project_name}-phuong-test"
  role          = aws_iam_role.phuong_test_lambda_role.arn
  handler       = "index.handler"
  runtime       = var.python_runtime
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  filename         = data.archive_file.phuong_test_zip.output_path
  source_code_hash = null_resource.phuong_test_lambda_source_hash.triggers.source_code_hash
  layers           = [aws_lambda_layer_version.phuong_test_layer.arn]

  environment {
    variables = {
      S3_BUCKET  = aws_s3_bucket.phuong_test_bucket.bucket
    }
  }
}

# Output values
output "phuong_test_lambda_function_name" {
  value = aws_lambda_function.phuong_test.function_name
}

output "phuong_test_lambda_function_arn" {
  value = aws_lambda_function.phuong_test.arn
}

output "phuong_test_s3_bucket_name" {
  value = aws_s3_bucket.phuong_test_bucket.bucket
}