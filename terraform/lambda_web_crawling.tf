# --- Resources for web_crawling Lambda ---

# Lambda layer for web_crawling function
resource "null_resource" "web_crawling_lambda_layer" {
  triggers = {
    requirements = filemd5("${path.module}/../lambda/web_crawling/requirements.txt")
  }

  provisioner "local-exec" {
    command = <<EOF
      rm -rf ${path.module}/../lambda/web_crawling/layer
      mkdir -p ${path.module}/../lambda/web_crawling/layer/python
      pip install -r ${path.module}/../lambda/web_crawling/requirements.txt -t ${path.module}/../lambda/web_crawling/layer/python
    EOF
  }
}

data "archive_file" "web_crawling_lambda_layer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/web_crawling/layer"
  output_path = "${path.module}/../lambda/web_crawling/lambda-layer.zip"
  
  depends_on = [null_resource.web_crawling_lambda_layer]
}

resource "aws_lambda_layer_version" "web_crawling_layer" {
  filename            = data.archive_file.web_crawling_lambda_layer_zip.output_path
  layer_name          = "${var.project_name}-web-crawling-layer"
  compatible_runtimes = [var.python_runtime]
  source_code_hash    = data.archive_file.web_crawling_lambda_layer_zip.output_base64sha256
}

# Lambda function code archive
data "archive_file" "web_crawling_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/web_crawling"
  output_path = "${path.module}/../lambda/web_crawling/lambda.zip"
  excludes    = ["requirements.txt", "layer/", "test.py"]
}

resource "aws_iam_role" "web_crawling_lambda_role" {
  name = "${var.project_name}-web-crawling-lambda-role"

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

resource "aws_iam_role_policy_attachment" "web_crawling_lambda_policy" {
  role       = aws_iam_role.web_crawling_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "web_crawling" {
  function_name = "${var.project_name}-web-crawling"
  role          = aws_iam_role.web_crawling_lambda_role.arn
  handler       = "index.lambda_handler"
  runtime       = var.python_runtime
  timeout       = 60 # Longer timeout for web requests
  memory_size   = var.lambda_memory_size

  filename         = data.archive_file.web_crawling_zip.output_path
  source_code_hash = data.archive_file.web_crawling_zip.output_base64sha256
  layers           = [aws_lambda_layer_version.web_crawling_layer.arn]
}
