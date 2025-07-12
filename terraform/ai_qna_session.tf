# --- Resources for ai_qna_session Lambda ---

data "archive_file" "ai_qna_session_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/ai_qna_session"
  output_path = "${path.module}/../lambda/ai_qna_session.zip"
}

resource "aws_iam_role" "ai_qna_session_lambda_role" {
  name = "${var.project_name}-ai-qna-session-lambda-role"

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

resource "aws_iam_role_policy_attachment" "ai_qna_session_lambda_policy" {
  role       = aws_iam_role.ai_qna_session_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "ai_qna_session_bedrock_policy" {
  role       = aws_iam_role.ai_qna_session_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonBedrockFullAccess" # Consider creating a more restrictive policy
}

resource "aws_lambda_function" "ai_qna_session" {
  function_name = "${var.project_name}-ai-qna-session"
  role          = aws_iam_role.ai_qna_session_lambda_role.arn
  handler       = "index.lambda_handler"
  runtime       = var.python_runtime
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  filename         = data.archive_file.ai_qna_session_zip.output_path
  source_code_hash = data.archive_file.ai_qna_session_zip.output_base64sha256

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

resource "aws_cloudwatch_log_group" "ai_qna_session_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.ai_qna_session.function_name}"
  retention_in_days = 14
}
