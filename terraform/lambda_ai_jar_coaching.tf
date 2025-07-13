# --- Resources for ai_jar_coaching Lambda ---

# Lambda layer for ai_jar_coaching function
resource "null_resource" "ai_jar_coaching_lambda_layer" {
  triggers = {
    requirements = filemd5("${path.module}/../lambda/ai_jar_coaching/requirements.txt")
  }

  provisioner "local-exec" {
    command = <<EOF
      rm -rf ${path.module}/../lambda/ai_jar_coaching/layer
      mkdir -p ${path.module}/../lambda/ai_jar_coaching/layer/python
      pip install -r ${path.module}/../lambda/ai_jar_coaching/requirements.txt -t ${path.module}/../lambda/ai_jar_coaching/layer/python
    EOF
  }
}

data "archive_file" "ai_jar_coaching_lambda_layer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/ai_jar_coaching/layer"
  output_path = "${path.module}/../lambda/ai_jar_coaching/lambda-layer.zip"
  
  depends_on = [null_resource.ai_jar_coaching_lambda_layer]
}

resource "aws_lambda_layer_version" "ai_jar_coaching_layer" {
  filename            = data.archive_file.ai_jar_coaching_lambda_layer_zip.output_path
  layer_name          = "${var.project_name}-ai-jar-coaching-layer"
  compatible_runtimes = [var.python_runtime]
  source_code_hash    = data.archive_file.ai_jar_coaching_lambda_layer_zip.output_base64sha256
}

# Lambda function code archive
data "archive_file" "ai_jar_coaching_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/ai_jar_coaching"
  output_path = "${path.module}/../lambda/ai_jar_coaching/lambda.zip"
  excludes    = ["requirements.txt", "layer/"]
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
  layers           = [aws_lambda_layer_version.ai_jar_coaching_layer.arn]

  environment {
    variables = {
      DB_HOST          = aws_db_instance.mysql.address
      DB_PORT          = aws_db_instance.mysql.port
      DB_NAME          = aws_db_instance.mysql.db_name
      DB_USER          = aws_db_instance.mysql.username
      DB_PASSWORD      = var.db_password
      BEDROCK_MODEL_ID = var.bedrock_model_id
    }
  }

  vpc_config {
    subnet_ids         = [for subnet in aws_subnet.private : subnet.id]
    security_group_ids = [aws_security_group.rds.id]
  }

  depends_on = [aws_db_instance.mysql]
}
