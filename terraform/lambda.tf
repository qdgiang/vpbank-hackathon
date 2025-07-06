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


resource "null_resource" "query_lambda_layer" {
  triggers = {
    requirements = filebase64("${path.module}/../lambda/query/requirements.txt")
  }

  provisioner "local-exec" {
    command = <<EOF
      rm -rf ${path.module}/../lambda/query/layer
      mkdir -p ${path.module}/../lambda/query/layer/python
      pip install -r ${path.module}/../lambda/query/requirements.txt -t ${path.module}/../lambda/query/layer/python
    EOF
  }
}

data "archive_file" "query_lambda_layer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/query/layer"
  output_path = "${path.module}/../lambda/query/lambda-layer.zip"
  
  depends_on = [null_resource.query_lambda_layer]
}

resource "aws_lambda_layer_version" "query_python_packages_layer" {
  filename            = data.archive_file.query_lambda_layer_zip.output_path
  layer_name          = "${var.project_name}-query-python-packages-layer"
  compatible_runtimes = ["python3.9"]
  source_code_hash    = data.archive_file.query_lambda_layer_zip.output_base64sha256

  description = "Python packages layer for query function"
  
  depends_on = [null_resource.query_lambda_layer]
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/query"
  output_path = "${path.module}/../lambda/query/lambda.zip"
  excludes    = ["requirements.txt"]
}

resource "aws_lambda_function" "transaction_query" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project_name}-transaction-query"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 30
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  layers          = [aws_lambda_layer_version.query_python_packages_layer.arn]

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DB_HOST     = aws_db_instance.mysql.endpoint
      DB_PORT     = tostring(aws_db_instance.mysql.port)
      DB_NAME     = aws_db_instance.mysql.db_name
      DB_USER     = aws_db_instance.mysql.username
      DB_PASSWORD = var.db_password
    }
  }

  tags = {
    Name = "${var.project_name}-transaction-query"
  }
}