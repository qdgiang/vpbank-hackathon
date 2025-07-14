# Lambda security group and IAM role
resource "aws_security_group" "lambda" {
  name        = "${var.project_name}-lambda-sg"
  description = "Security group for Lambda function"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-lambda-sg"
  }
}

resource "aws_iam_role" "lambda_execution" {
  name = "${var.project_name}-lambda-execution-role"

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
    Name = "${var.project_name}-lambda-execution-role"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_access" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_rds_access" {
  name = "${var.project_name}-lambda-rds-access"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:DescribeDBClusters"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda layer for crud_test function
resource "null_resource" "crud_test_lambda_layer" {
  triggers = {
    requirements = filemd5("${path.module}/../lambda/crud_test/requirements.txt")
  }

  provisioner "local-exec" {
    command = <<EOF
      rm -rf ${path.module}/../lambda/crud_test/layer
      mkdir -p ${path.module}/../lambda/crud_test/layer/python
      pip install -r ${path.module}/../lambda/crud_test/requirements.txt -t ${path.module}/../lambda/crud_test/layer/python
    EOF
  }
}

data "archive_file" "crud_test_lambda_layer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/crud_test/layer"
  output_path = "${path.module}/../lambda/crud_test/lambda-layer.zip"
  
  depends_on = [null_resource.crud_test_lambda_layer]
}

resource "aws_lambda_layer_version" "crud_test_python_packages_layer" {
  filename            = data.archive_file.crud_test_lambda_layer_zip.output_path
  layer_name          = "${var.project_name}-crud-test-python-packages-layer"
  compatible_runtimes = ["python3.9"]
  source_code_hash    = data.archive_file.crud_test_lambda_layer_zip.output_base64sha256

  description = "Python packages layer for crud_test function"
  
  depends_on = [null_resource.crud_test_lambda_layer]
}

# Null resource to control lambda updates based on source file changes
resource "null_resource" "crud_test_lambda_source_hash" {
  triggers = {
    source_code = filemd5("${path.module}/../lambda/crud_test/index.py")
  }
}

# Lambda function code archive
data "archive_file" "crud_test_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/crud_test"
  output_path = "${path.module}/../lambda/crud_test/lambda.zip"
  excludes    = ["requirements.txt", "layer/"]
}

# Lambda function
resource "aws_lambda_function" "crud_test" {
  filename         = data.archive_file.crud_test_lambda_zip.output_path
  function_name    = "${var.project_name}-crud-test"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 30
  source_code_hash = null_resource.crud_test_lambda_source_hash.triggers.source_code
  layers          = [aws_lambda_layer_version.crud_test_python_packages_layer.arn]

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
    Name = "${var.project_name}-crud-test"
  }
}