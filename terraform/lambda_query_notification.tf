# Lambda layer for query_notification function
resource "null_resource" "query_notification_lambda_layer" {
  triggers = {
    requirements = filemd5("${path.module}/../lambda/query_notification/requirements.txt")
  }

  provisioner "local-exec" {
    command = <<EOF
      rm -rf ${path.module}/../lambda/query_notification/layer
      mkdir -p ${path.module}/../lambda/query_notification/layer/python
      pip install -r ${path.module}/../lambda/query_notification/requirements.txt -t ${path.module}/../lambda/query_notification/layer/python
    EOF
  }
}

data "archive_file" "query_notification_lambda_layer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/query_notification/layer"
  output_path = "${path.module}/../lambda/query_notification/lambda-layer.zip"
  
  depends_on = [null_resource.query_notification_lambda_layer]
}

resource "aws_lambda_layer_version" "query_notification_python_packages_layer" {
  filename            = data.archive_file.query_notification_lambda_layer_zip.output_path
  layer_name          = "${var.project_name}-query-notification-python-packages-layer"
  compatible_runtimes = ["python3.9"]
  source_code_hash    = data.archive_file.query_notification_lambda_layer_zip.output_base64sha256

  description = "Python packages layer for query_notification function"
  
  depends_on = [null_resource.query_notification_lambda_layer]
}

# Null resource to control lambda updates based on source file changes
resource "null_resource" "query_notification_lambda_source_hash" {
  triggers = {
    source_code = filemd5("${path.module}/../lambda/query_notification/index.py")
  }
}

# Lambda function code archive
data "archive_file" "query_notification_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/query_notification"
  output_path = "${path.module}/../lambda/query_notification/lambda.zip"
  excludes    = ["requirements.txt", "layer/"]
}

# Lambda function
resource "aws_lambda_function" "query_notification" {
  filename         = data.archive_file.query_notification_lambda_zip.output_path
  function_name    = "${var.project_name}-query-notification"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 30
  source_code_hash = null_resource.query_notification_lambda_source_hash.triggers.source_code
  layers          = [aws_lambda_layer_version.query_notification_python_packages_layer.arn]

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
    Name = "${var.project_name}-query-notification"
  }
}