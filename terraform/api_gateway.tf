

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

# /transactions_queue resource
resource "aws_api_gateway_resource" "transactions_queue" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_rest_api.test_api.root_resource_id
  path_part   = "transactions_queue"
}

# GET method for /test
resource "aws_api_gateway_method" "test_get" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.test.id
  http_method   = "GET"
  authorization = "NONE"
}

# POST method for /transactions_queue
resource "aws_api_gateway_method" "transactions_queue_post" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.transactions_queue.id
  http_method   = "POST"
  authorization = "NONE"
}

# Lambda integration for GET method
resource "aws_api_gateway_integration" "test_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.test.id
  http_method = aws_api_gateway_method.test_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.query_test.invoke_arn
}

# SQS integration for POST method
resource "aws_api_gateway_integration" "transactions_queue_sqs" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.transactions_queue.id
  http_method = aws_api_gateway_method.transactions_queue_post.http_method

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

# Method response for POST /transactions_queue
resource "aws_api_gateway_method_response" "transactions_queue_post_200" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.transactions_queue.id
  http_method = aws_api_gateway_method.transactions_queue_post.http_method
  status_code = "200"
}

# Integration response for POST /transactions_queue
resource "aws_api_gateway_integration_response" "transactions_queue_sqs_200" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.transactions_queue.id
  http_method = aws_api_gateway_method.transactions_queue_post.http_method
  status_code = aws_api_gateway_method_response.transactions_queue_post_200.status_code

  selection_pattern = "200"

  response_templates = {
    "application/json" = "{\"message\": \"Transaction queued successfully\", \"messageId\": \"$input.path('$.SendMessageResponse.SendMessageResult.MessageId')\"}"
  }

  depends_on = [aws_api_gateway_integration.transactions_queue_sqs]
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "test_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.query_test.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.test_api.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "test" {
  depends_on = [
    aws_api_gateway_method.test_get,
    aws_api_gateway_integration.test_lambda,
    aws_api_gateway_method.transactions_queue_post,
    aws_api_gateway_integration.transactions_queue_sqs,
    aws_api_gateway_method_response.transactions_queue_post_200,
    aws_api_gateway_integration_response.transactions_queue_sqs_200,
  ]

  rest_api_id = aws_api_gateway_rest_api.test_api.id
}

# API Gateway Stage
resource "aws_api_gateway_stage" "test_api" {
  deployment_id = aws_api_gateway_deployment.test.id
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  stage_name    = "v1"
}