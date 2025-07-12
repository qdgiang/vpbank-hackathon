# --- Resources for ai_goal_coaching Lambda ---

data "archive_file" "ai_goal_coaching_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/ai_goal_coaching"
  output_path = "${path.module}/../lambda/ai_goal_coaching.zip"
}

resource "aws_iam_role" "ai_goal_coaching_lambda_role" {
  name = "${var.project_name}-ai-goal-coaching-lambda-role"

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

resource "aws_iam_role_policy_attachment" "ai_goal_coaching_lambda_policy" {
  role       = aws_iam_role.ai_goal_coaching_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "ai_goal_coaching_bedrock_policy" {
  role       = aws_iam_role.ai_goal_coaching_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonBedrockFullAccess"
}

resource "aws_lambda_function" "ai_goal_coaching" {
  function_name = "${var.project_name}-ai-goal-coaching"
  role          = aws_iam_role.ai_goal_coaching_lambda_role.arn
  handler       = "index.lambda_handler"
  runtime       = var.python_runtime
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  filename         = data.archive_file.ai_goal_coaching_zip.output_path
  source_code_hash = data.archive_file.ai_goal_coaching_zip.output_base64sha256

  environment {
    variables = {
      DB_HOST     = aws_db_instance.main.address
      DB_USER     = var.db_username
      DB_PASSWORD = var.db_password
      DB_NAME     = var.db_name
      MODEL_ID    = var.bedrock_model_id
      REGION_NAME = var.bedrock_region
    }
  }

  depends_on = [aws_db_instance.main]
}

resource "aws_cloudwatch_log_group" "ai_goal_coaching_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.ai_goal_coaching.function_name}"
  retention_in_days = 14
}
