# Lambda layer for set_goal function
resource "null_resource" "set_goal_lambda_layer" {
  triggers = {
    requirements = filebase64("${path.module}/../lambda/set_goal/requirements.txt")
  }

  provisioner "local-exec" {
    command = <<EOF
      rm -rf ${path.module}/../lambda/set_goal/layer
      mkdir -p ${path.module}/../lambda/set_goal/layer/python
      pip install -r ${path.module}/../lambda/set_goal/requirements.txt -t ${path.module}/../lambda/set_goal/layer/python
    EOF
  }
}

data "archive_file" "set_goal_lambda_layer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/set_goal/layer"
  output_path = "${path.module}/../lambda/set_goal/lambda-layer.zip"
  depends_on  = [null_resource.set_goal_lambda_layer]
}

resource "aws_lambda_layer_version" "set_goal_python_packages_layer" {
  filename            = data.archive_file.set_goal_lambda_layer_zip.output_path
  layer_name          = "${var.project_name}-set-goal-python-packages-layer"
  compatible_runtimes = ["python3.9"]
  source_code_hash    = data.archive_file.set_goal_lambda_layer_zip.output_base64sha256

  description = "Python packages layer for set_goal function"
  depends_on  = [null_resource.set_goal_lambda_layer]
}

# Null resource to control lambda updates based on source file changes
resource "null_resource" "set_goal_lambda_source_hash" {
  triggers = {
    source_code = filebase64("${path.module}/../lambda/set_goal/index.py")
  }
}

# Lambda function code archive
data "archive_file" "set_goal_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/set_goal"
  output_path = "${path.module}/../lambda/set_goal/lambda.zip"
  excludes    = ["requirements.txt", "layer/"]
}

# Lambda function
resource "aws_lambda_function" "set_goal" {
  filename         = data.archive_file.set_goal_lambda_zip.output_path
  function_name    = "${var.project_name}-set-goal"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.lambda_handler"
  runtime          = "python3.9"
  timeout          = 30
  source_code_hash = null_resource.set_goal_lambda_source_hash.triggers.source_code
  layers           = [aws_lambda_layer_version.set_goal_python_packages_layer.arn]

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
    Name = "${var.project_name}-set-goal"
  }
}