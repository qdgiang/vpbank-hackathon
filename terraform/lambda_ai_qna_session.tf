# --- Resources for ai_qna_session Lambda ---

# Lambda layer for ai_qna_session function
resource "null_resource" "ai_qna_session_lambda_layer" {
  triggers = {
    requirements = filemd5("${path.module}/../lambda/ai_qna_session/requirements.txt")
  }

  provisioner "local-exec" {
    command = <<EOF
      rm -rf ${path.module}/../lambda/ai_qna_session/layer
      mkdir -p ${path.module}/../lambda/ai_qna_session/layer/python
      pip install -r ${path.module}/../lambda/ai_qna_session/requirements.txt -t ${path.module}/../lambda/ai_qna_session/layer/python
    EOF
  }
}

data "archive_file" "ai_qna_session_lambda_layer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/ai_qna_session/layer"
  output_path = "${path.module}/../lambda/ai_qna_session/lambda-layer.zip"
  
  depends_on = [null_resource.ai_qna_session_lambda_layer]
}

resource "aws_lambda_layer_version" "ai_qna_session_layer" {
  filename            = data.archive_file.ai_qna_session_lambda_layer_zip.output_path
  layer_name          = "${var.project_name}-ai-qna-session-layer"
  compatible_runtimes = [var.python_runtime]
  source_code_hash    = data.archive_file.ai_qna_session_lambda_layer_zip.output_base64sha256
}

# Null resource to control lambda updates based on source file changes
resource "null_resource" "ai_qna_session_lambda_source_hash" {
  triggers = {
    source_code_hash = md5(join("", [
      for f in fileset("${path.module}/../lambda/ai_qna_session", "**/*.py") :
      filemd5("${path.module}/../lambda/ai_qna_session/${f}")
    ]))
  }
}

# Lambda function code archive
data "archive_file" "ai_qna_session_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/ai_qna_session"
  output_path = "${path.module}/../lambda/ai_qna_session/lambda.zip"
  excludes    = ["requirements.txt", "layer/", ".env", "__pycache__/", "mock_local_db.py", "schema_saving_goals.json", "schema_user_jar_spending.json"]
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

resource "aws_iam_role_policy_attachment" "ai_qna_session_vpc_access" {
  role       = aws_iam_role.ai_qna_session_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_lambda_function" "ai_qna_session" {
  function_name = "${var.project_name}-ai-qna-session"
  role          = aws_iam_role.ai_qna_session_lambda_role.arn
  handler       = "index.handler"
  runtime       = var.python_runtime
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  filename         = data.archive_file.ai_qna_session_zip.output_path
  source_code_hash = null_resource.ai_qna_session_lambda_source_hash.triggers.source_code_hash
  layers           = [aws_lambda_layer_version.ai_qna_session_layer.arn]

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
