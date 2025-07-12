# --- Resources for web_crawling Lambda ---

data "archive_file" "web_crawling_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/web_crawling"
  output_path = "${path.module}/../lambda/web_crawling.zip"
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
}

resource "aws_cloudwatch_log_group" "web_crawling_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.web_crawling.function_name}"
  retention_in_days = 14
}
