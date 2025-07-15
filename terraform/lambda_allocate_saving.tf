# Lambda layer for allocate_saving function
resource "null_resource" "allocate_saving_lambda_layer" {
  triggers = {
    requirements = filemd5("${path.module}/../lambda/allocate_saving/requirements.txt")
  }

  provisioner "local-exec" {
    command = <<EOF
      rm -rf ${path.module}/../lambda/allocate_saving/layer
      mkdir -p ${path.module}/../lambda/allocate_saving/layer/python
      pip install -r ${path.module}/../lambda/allocate_saving/requirements.txt -t ${path.module}/../lambda/allocate_saving/layer/python
    EOF
  }
}

data "archive_file" "allocate_saving_lambda_layer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/allocate_saving/layer"
  output_path = "${path.module}/../lambda/allocate_saving/lambda-layer.zip"

  depends_on = [null_resource.allocate_saving_lambda_layer]
}

resource "aws_lambda_layer_version" "allocate_saving_python_packages_layer" {
  filename            = data.archive_file.allocate_saving_lambda_layer_zip.output_path
  layer_name          = "${var.project_name}-allocate-saving-python-packages-layer"
  compatible_runtimes = ["python3.9"]
  source_code_hash    = data.archive_file.allocate_saving_lambda_layer_zip.output_base64sha256

  description = "Python packages layer for allocate_saving function"

  depends_on = [null_resource.allocate_saving_lambda_layer]
}

# Null resource to control lambda updates based on source file changes
resource "null_resource" "allocate_saving_lambda_source_hash" {
  triggers = {
    source_code = filemd5("${path.module}/../lambda/allocate_saving/index.py")
  }
}

# Lambda function code archive
data "archive_file" "allocate_saving_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/allocate_saving"
  output_path = "${path.module}/../lambda/allocate_saving/lambda.zip"
  excludes    = ["requirements.txt", "layer/"]
}

# Lambda function
resource "aws_lambda_function" "allocate_saving" {
  filename         = data.archive_file.allocate_saving_lambda_zip.output_path
  function_name    = "${var.project_name}-allocate-saving"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.lambda_handler"
  runtime          = "python3.9"
  timeout          = 30
  source_code_hash = null_resource.allocate_saving_lambda_source_hash.triggers.source_code
  layers           = [aws_lambda_layer_version.allocate_saving_python_packages_layer.arn]

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
    Name = "${var.project_name}-allocate-saving"
  }
}