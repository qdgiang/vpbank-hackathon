

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

# GET method for /test
resource "aws_api_gateway_method" "test_get" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.test.id
  http_method   = "GET"
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
  ]

  rest_api_id = aws_api_gateway_rest_api.test_api.id
}

# API Gateway Stage
resource "aws_api_gateway_stage" "test_api" {
  deployment_id = aws_api_gateway_deployment.test.id
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  stage_name    = "v1"
}