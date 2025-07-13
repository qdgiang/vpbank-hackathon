# --- Resources for ai_goal_coaching Lambda ---

# Lambda layer for ai_goal_coaching function
resource "null_resource" "ai_goal_coaching_lambda_layer" {
  triggers = {
    requirements = filemd5("${path.module}/../lambda/ai_goal_coaching/requirements.txt")
  }

  provisioner "local-exec" {
    command = <<EOF
      rm -rf ${path.module}/../lambda/ai_goal_coaching/layer
      mkdir -p ${path.module}/../lambda/ai_goal_coaching/layer/python
      pip install -r ${path.module}/../lambda/ai_goal_coaching/requirements.txt -t ${path.module}/../lambda/ai_goal_coaching/layer/python
    EOF
  }
}

data "archive_file" "ai_goal_coaching_lambda_layer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/ai_goal_coaching/layer"
  output_path = "${path.module}/../lambda/ai_goal_coaching/lambda-layer.zip"
  
  depends_on = [null_resource.ai_goal_coaching_lambda_layer]
}

resource "aws_lambda_layer_version" "ai_goal_coaching_layer" {
  filename            = data.archive_file.ai_goal_coaching_lambda_layer_zip.output_path
  layer_name          = "${var.project_name}-ai-goal-coaching-layer"
  compatible_runtimes = [var.python_runtime]
  source_code_hash    = data.archive_file.ai_goal_coaching_lambda_layer_zip.output_base64sha256
}

# Lambda function code archive
data "archive_file" "ai_goal_coaching_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/ai_goal_coaching"
  output_path = "${path.module}/../lambda/ai_goal_coaching/lambda.zip"
  excludes    = ["requirements.txt", "layer/", ".env", "test.ipynb", "mock_kb/"]
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

resource "aws_iam_role_policy_attachment" "ai_goal_coaching_vpc_access" {
  role       = aws_iam_role.ai_goal_coaching_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_lambda_function" "ai_goal_coaching" {
  function_name = "${var.project_name}-ai-goal-coaching"
  role          = aws_iam_role.ai_goal_coaching_lambda_role.arn
  handler       = "index.handler"
  runtime       = var.python_runtime
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  filename         = data.archive_file.ai_goal_coaching_zip.output_path
  source_code_hash = data.archive_file.ai_goal_coaching_zip.output_base64sha256
  layers           = [aws_lambda_layer_version.ai_goal_coaching_layer.arn]

  environment {
    variables = {
      DB_HOST          = aws_db_instance.mysql.address
      DB_PORT          = aws_db_instance.mysql.port
      DB_NAME          = aws_db_instance.mysql.db_name
      DB_USER          = aws_db_instance.mysql.username
      DB_PASSWORD      = var.db_password
      BEDROCK_MODEL_ID = var.bedrock_model_id
      BEDROCK_KB_ID    = var.bedrock_kb_id
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.rds.id]
  }

  depends_on = [aws_db_instance.mysql, aws_security_group.rds]
}