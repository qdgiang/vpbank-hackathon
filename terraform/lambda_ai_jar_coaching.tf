# --- Resources for ai_jar_coaching Lambda ---

data "archive_file" "ai_jar_coaching_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/ai_jar_coaching"
  output_path = "${path.module}/../lambda/ai_jar_coaching.zip"
}

resource "aws_iam_role" "ai_jar_coaching_lambda_role" {
  name = "${var.project_name}-ai-jar-coaching-lambda-role"

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

resource "aws_iam_role_policy_attachment" "ai_jar_coaching_lambda_policy" {
  role       = aws_iam_role.ai_jar_coaching_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "ai_jar_coaching_bedrock_policy" {
  role       = aws_iam_role.ai_jar_coaching_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonBedrockFullAccess" # Consider creating a more restrictive policy
}

resource "aws_iam_role_policy_attachment" "ai_jar_coaching_vpc_access_policy" {
  role       = aws_iam_role.ai_jar_coaching_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_lambda_function" "ai_jar_coaching" {
  function_name = "${var.project_name}-ai-jar-coaching"
  role          = aws_iam_role.ai_jar_coaching_lambda_role.arn
  handler       = "index.handler"
  runtime       = var.python_runtime
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  filename         = data.archive_file.ai_jar_coaching_zip.output_path
  source_code_hash = data.archive_file.ai_jar_coaching_zip.output_base64sha256

  environment {
    variables = {
      DB_HOST          = aws_db_instance.main.address
      DB_PORT          = aws_db_instance.main.port
      DB_NAME          = var.db_name
      DB_USER          = var.db_username
      DB_PASSWORD      = var.db_password
      AWS_REGION       = var.aws_region
      BEDROCK_MODEL_ID = var.bedrock_model_id
    }
  }

  vpc_config {
    subnet_ids         = [for subnet in aws_subnet.private : subnet.id]
    security_group_ids = [aws_security_group.db.id]
  }

  depends_on = [aws_db_instance.main]
}

resource "aws_cloudwatch_log_group" "ai_jar_coaching_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.ai_jar_coaching.function_name}"
  retention_in_days = 14
}
