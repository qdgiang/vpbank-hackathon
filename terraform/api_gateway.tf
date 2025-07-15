

# API Gateway REST API
resource "aws_api_gateway_rest_api" "test_api" {
  name = "lambda-query-test-api-gateway"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  
  tags = {
    Name = "lambda-query-test-api-gateway"
  }
}

# /test resource
resource "aws_api_gateway_resource" "test" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_rest_api.test_api.root_resource_id
  path_part   = "test"
}

# /transaction resource
resource "aws_api_gateway_resource" "transaction" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_rest_api.test_api.root_resource_id
  path_part   = "transaction"
}

# /transaction/create resource
resource "aws_api_gateway_resource" "transaction_create" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.transaction.id
  path_part   = "create"
}

# /jar resource
resource "aws_api_gateway_resource" "jar" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_rest_api.test_api.root_resource_id
  path_part   = "jar"
}

# /jar/{id} resource
resource "aws_api_gateway_resource" "jar_id" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.jar.id
  path_part   = "{id}"
}

# /jar/initialize resource
resource "aws_api_gateway_resource" "jar_initialize" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.jar.id
  path_part   = "initialize"
}

# /jar/percent resource
resource "aws_api_gateway_resource" "jar_percent" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.jar.id
  path_part   = "percent"
}

# GET method for /test
resource "aws_api_gateway_method" "test_get" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.test.id
  http_method   = "GET"
  authorization = "NONE"
}

# POST method for /transaction/create
resource "aws_api_gateway_method" "transaction_create_post" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.transaction_create.id
  http_method   = "POST"
  authorization = "NONE"
}

# GET method for /jar/{id}
resource "aws_api_gateway_method" "jar_id_get" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.jar_id.id
  http_method   = "GET"
  authorization = "NONE"
}

# POST method for /jar/initialize
resource "aws_api_gateway_method" "jar_initialize_post" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.jar_initialize.id
  http_method   = "POST"
  authorization = "NONE"
}

# PUT method for /jar/percent
resource "aws_api_gateway_method" "jar_percent_put" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.jar_percent.id
  http_method   = "PUT"
  authorization = "NONE"
}

# Lambda integration for GET method
resource "aws_api_gateway_integration" "test_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.test.id
  http_method = aws_api_gateway_method.test_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_test.invoke_arn
}

# SQS integration for POST method
resource "aws_api_gateway_integration" "transaction_create_sqs" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.transaction_create.id
  http_method = aws_api_gateway_method.transaction_create_post.http_method

  integration_http_method = "POST"
  type                    = "AWS"
  uri                     = "arn:aws:apigateway:${var.aws_region}:sqs:path//"
  credentials             = aws_iam_role.api_gateway_sqs_role.arn

  request_parameters = {
    "integration.request.header.Content-Type" = "'application/x-www-form-urlencoded'"
  }

  request_templates = {
    "application/json" = "Action=SendMessage&QueueUrl=$util.urlEncode('${aws_sqs_queue.transactions_fifo.url}')&MessageGroupId=$input.path('$.user_id')&MessageBody=$util.urlEncode($input.json('$'))"
  }
}

# Lambda integration for GET /jar/{id}
resource "aws_api_gateway_integration" "jar_id_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.jar_id.id
  http_method = aws_api_gateway_method.jar_id_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_jar.invoke_arn
}

# Lambda integration for POST /jar/initialize
resource "aws_api_gateway_integration" "jar_initialize_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.jar_initialize.id
  http_method = aws_api_gateway_method.jar_initialize_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_jar.invoke_arn
}

# Lambda integration for PUT /jar/percent
resource "aws_api_gateway_integration" "jar_percent_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.jar_percent.id
  http_method = aws_api_gateway_method.jar_percent_put.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_jar.invoke_arn
}

# Method response for POST /transaction/create
resource "aws_api_gateway_method_response" "transaction_create_post_200" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.transaction_create.id
  http_method = aws_api_gateway_method.transaction_create_post.http_method
  status_code = "200"
}

# Integration response for POST /transaction/create
resource "aws_api_gateway_integration_response" "transaction_create_sqs_200" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.transaction_create.id
  http_method = aws_api_gateway_method.transaction_create_post.http_method
  status_code = aws_api_gateway_method_response.transaction_create_post_200.status_code

  selection_pattern = "200"

  response_templates = {
    "application/json" = "{\"message\": \"Transaction queued successfully\", \"messageId\": \"$input.path('$.SendMessageResponse.SendMessageResult.MessageId')\"}"
  }

  depends_on = [aws_api_gateway_integration.transaction_create_sqs]
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "test_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.crud_test.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.test_api.execution_arn}/*/*"
}

# Lambda permission for jar API Gateway
resource "aws_lambda_permission" "jar_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGatewayJar"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.crud_jar.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.test_api.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "test" {
  depends_on = [
    aws_api_gateway_method.test_get,
    aws_api_gateway_integration.test_lambda,
    aws_api_gateway_method.transaction_create_post,
    aws_api_gateway_integration.transaction_create_sqs,
    aws_api_gateway_method_response.transaction_create_post_200,
    aws_api_gateway_integration_response.transaction_create_sqs_200,
    aws_api_gateway_method.jar_id_get,
    aws_api_gateway_integration.jar_id_lambda,
    aws_api_gateway_method.jar_initialize_post,
    aws_api_gateway_integration.jar_initialize_lambda,
    aws_api_gateway_method.jar_percent_put,
    aws_api_gateway_integration.jar_percent_lambda,
  ]

  rest_api_id = aws_api_gateway_rest_api.test_api.id
  
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.transaction.id,
      aws_api_gateway_resource.transaction_create.id,
      aws_api_gateway_method.transaction_create_post.id,
      aws_api_gateway_integration.transaction_create_sqs.id,
      aws_api_gateway_resource.jar.id,
      aws_api_gateway_resource.jar_id.id,
      aws_api_gateway_resource.jar_initialize.id,
      aws_api_gateway_resource.jar_percent.id,
      aws_api_gateway_method.jar_id_get.id,
      aws_api_gateway_method.jar_initialize_post.id,
      aws_api_gateway_method.jar_percent_put.id,
      aws_api_gateway_integration.jar_id_lambda.id,
      aws_api_gateway_integration.jar_initialize_lambda.id,
      aws_api_gateway_integration.jar_percent_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage
resource "aws_api_gateway_stage" "test_api" {
  deployment_id = aws_api_gateway_deployment.test.id
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  stage_name    = "v1"
}