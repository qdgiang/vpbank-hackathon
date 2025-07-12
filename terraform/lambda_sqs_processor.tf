# IAM role for SQS processor Lambda
resource "aws_iam_role" "sqs_processor_lambda_execution" {
  name = "${var.project_name}-sqs-processor-lambda-execution-role"

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

  tags = {
    Name = "${var.project_name}-sqs-processor-lambda-execution-role"
  }
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "sqs_processor_lambda_basic" {
  role       = aws_iam_role.sqs_processor_lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Attach VPC access policy for Lambda
resource "aws_iam_role_policy_attachment" "sqs_processor_lambda_vpc_access" {
  role       = aws_iam_role.sqs_processor_lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# SQS access policy for Lambda
resource "aws_iam_role_policy" "sqs_processor_lambda_sqs_access" {
  name = "${var.project_name}-sqs-processor-lambda-sqs-access"
  role = aws_iam_role.sqs_processor_lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.transactions_fifo.arn
      }
    ]
  })
}

# Lambda layer for SQS processor function
resource "null_resource" "sqs_processor_lambda_layer" {
  triggers = {
    requirements = filemd5("${path.module}/../lambda/sqs_processor/requirements.txt")
  }

  provisioner "local-exec" {
    command = <<EOF
      rm -rf ${path.module}/../lambda/sqs_processor/layer
      mkdir -p ${path.module}/../lambda/sqs_processor/layer/python
      pip install -r ${path.module}/../lambda/sqs_processor/requirements.txt -t ${path.module}/../lambda/sqs_processor/layer/python
    EOF
  }
}

data "archive_file" "sqs_processor_lambda_layer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/sqs_processor/layer"
  output_path = "${path.module}/../lambda/sqs_processor/lambda-layer.zip"
  
  depends_on = [null_resource.sqs_processor_lambda_layer]
}

resource "aws_lambda_layer_version" "sqs_processor_python_packages_layer" {
  filename            = data.archive_file.sqs_processor_lambda_layer_zip.output_path
  layer_name          = "${var.project_name}-sqs-processor-python-packages-layer"
  compatible_runtimes = ["python3.9"]
  source_code_hash    = data.archive_file.sqs_processor_lambda_layer_zip.output_base64sha256

  description = "Python packages layer for SQS processor function"
  
  depends_on = [null_resource.sqs_processor_lambda_layer]
}

# Null resource to control lambda updates based on source file changes
resource "null_resource" "sqs_processor_lambda_source_hash" {
  triggers = {
    source_code = filemd5("${path.module}/../lambda/sqs_processor/index.py")
  }
}

# Lambda function code archive
data "archive_file" "sqs_processor_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/sqs_processor"
  output_path = "${path.module}/../lambda/sqs_processor/lambda.zip"
  excludes    = ["requirements.txt", "layer/"]
}

# SQS Processor Lambda function
resource "aws_lambda_function" "sqs_processor" {
  filename         = data.archive_file.sqs_processor_lambda_zip.output_path
  function_name    = "${var.project_name}-sqs-processor"
  role            = aws_iam_role.sqs_processor_lambda_execution.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 30
  source_code_hash = null_resource.sqs_processor_lambda_source_hash.triggers.source_code
  layers          = [aws_lambda_layer_version.sqs_processor_python_packages_layer.arn]

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DB_HOST     = aws_db_instance.mysql.address
      DB_PORT     = aws_db_instance.mysql.port
      DB_NAME     = aws_db_instance.mysql.db_name
      DB_USER     = aws_db_instance.mysql.username
      DB_PASSWORD = var.db_password
    }
  }

  tags = {
    Name = "${var.project_name}-sqs-processor"
  }
}

# SQS trigger for Lambda
resource "aws_lambda_event_source_mapping" "sqs_processor_trigger" {
  event_source_arn = aws_sqs_queue.transactions_fifo.arn
  function_name    = aws_lambda_function.sqs_processor.arn
  batch_size       = 10
  
  depends_on = [aws_iam_role_policy.sqs_processor_lambda_sqs_access]
}