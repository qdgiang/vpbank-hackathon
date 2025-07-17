

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

# /transaction/search resource
resource "aws_api_gateway_resource" "transaction_search" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.transaction.id
  path_part   = "search"
}

# /transaction/{id} resource
resource "aws_api_gateway_resource" "transaction_id" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.transaction.id
  path_part   = "{id}"
}

# /transaction/{id}/classify resource
resource "aws_api_gateway_resource" "transaction_id_classify" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.transaction_id.id
  path_part   = "classify"
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

# /notification resource
resource "aws_api_gateway_resource" "notification" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_rest_api.test_api.root_resource_id
  path_part   = "notification"
}

# /notification/search resource
resource "aws_api_gateway_resource" "notification_search" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.notification.id
  path_part   = "search"
}

# /notification/create resource
resource "aws_api_gateway_resource" "notification_create" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.notification.id
  path_part   = "create"
}

# /notification/{id} resource
resource "aws_api_gateway_resource" "notification_id" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.notification.id
  path_part   = "{id}"
}

# /notification/{id}/status resource
resource "aws_api_gateway_resource" "notification_id_status" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.notification_id.id
  path_part   = "status"
}

# /goal resource
resource "aws_api_gateway_resource" "goal" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_rest_api.test_api.root_resource_id
  path_part   = "goal"
}

# /goal/search resource
resource "aws_api_gateway_resource" "goal_search" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.goal.id
  path_part   = "search"
}

# /goal/create resource
resource "aws_api_gateway_resource" "goal_create" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.goal.id
  path_part   = "create"
}

# /goal/{id} resource
resource "aws_api_gateway_resource" "goal_id" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.goal.id
  path_part   = "{id}"
}

# /goal/allocate resource
resource "aws_api_gateway_resource" "goal_allocate" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.goal.id
  path_part   = "allocate"
}

# /goal/set resource
resource "aws_api_gateway_resource" "goal_set" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.goal.id
  path_part   = "set"
}

# /goal/delete resource
resource "aws_api_gateway_resource" "goal_delete" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.goal.id
  path_part   = "delete"
}

# /goal/delete/{goal_id} resource
resource "aws_api_gateway_resource" "goal_delete_id" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.goal_delete.id
  path_part   = "{goal_id}"
}

# /goal/pause resource
resource "aws_api_gateway_resource" "goal_pause" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.goal.id
  path_part   = "pause"
}

# /goal/pause/{goal_id} resource
resource "aws_api_gateway_resource" "goal_pause_id" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.goal_pause.id
  path_part   = "{goal_id}"
}

# /ai resource
resource "aws_api_gateway_resource" "ai" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_rest_api.test_api.root_resource_id
  path_part   = "ai"
}

# /ai/jar resource
resource "aws_api_gateway_resource" "ai_jar" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.ai.id
  path_part   = "jar"
}

# /ai/jar/coaching resource
resource "aws_api_gateway_resource" "ai_jar_coaching" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.ai_jar.id
  path_part   = "coaching"
}

# /ai/goal resource
resource "aws_api_gateway_resource" "ai_goal" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.ai.id
  path_part   = "goal"
}

# /ai/goal/coaching resource
resource "aws_api_gateway_resource" "ai_goal_coaching" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.ai_goal.id
  path_part   = "coaching"
}

# /ai/qna resource
resource "aws_api_gateway_resource" "ai_qna" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.ai.id
  path_part   = "qna"
}

# /ai/qna/session resource
resource "aws_api_gateway_resource" "ai_qna_session" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.ai_qna.id
  path_part   = "session"
}

# /auth resource
resource "aws_api_gateway_resource" "auth" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_rest_api.test_api.root_resource_id
  path_part   = "auth"
}

# /auth/{id} resource
resource "aws_api_gateway_resource" "auth_id" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "{id}"
}

# /auth/login resource
resource "aws_api_gateway_resource" "auth_login" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "login"
}

# /auth/logout resource
resource "aws_api_gateway_resource" "auth_logout" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "logout"
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

# POST method for /transaction/search
resource "aws_api_gateway_method" "transaction_search_post" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.transaction_search.id
  http_method   = "POST"
  authorization = "NONE"
}

# PATCH method for /transaction/{id}/classify
resource "aws_api_gateway_method" "transaction_id_classify_patch" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.transaction_id_classify.id
  http_method   = "PATCH"
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

# POST method for /notification/search
resource "aws_api_gateway_method" "notification_search_post" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.notification_search.id
  http_method   = "POST"
  authorization = "NONE"
}

# POST method for /notification/create
resource "aws_api_gateway_method" "notification_create_post" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.notification_create.id
  http_method   = "POST"
  authorization = "NONE"
}

# PATCH method for /notification/{id}/status
resource "aws_api_gateway_method" "notification_id_status_patch" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.notification_id_status.id
  http_method   = "PATCH"
  authorization = "NONE"
}

# POST method for /goal/search
resource "aws_api_gateway_method" "goal_search_post" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.goal_search.id
  http_method   = "POST"
  authorization = "NONE"
}

# POST method for /goal/create
resource "aws_api_gateway_method" "goal_create_post" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.goal_create.id
  http_method   = "POST"
  authorization = "NONE"
}

# POST method for /goal/allocate
resource "aws_api_gateway_method" "goal_allocate_post" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.goal_allocate.id
  http_method   = "POST"
  authorization = "NONE"
}


# DELETE method for /goal/{id}
resource "aws_api_gateway_method" "goal_id_delete" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.goal_id.id
  http_method   = "DELETE"
  authorization = "NONE"
}

# POST method for /goal/set
resource "aws_api_gateway_method" "goal_set_post" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.goal_set.id
  http_method   = "POST"
  authorization = "NONE"
}

# DELETE method for /goal/delete/{goal_id}
resource "aws_api_gateway_method" "goal_delete_id_delete" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.goal_delete_id.id
  http_method   = "DELETE"
  authorization = "NONE"
}

# PUT method for /goal/pause/{goal_id}
resource "aws_api_gateway_method" "goal_pause_id_put" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.goal_pause_id.id
  http_method   = "PUT"
  authorization = "NONE"
}

# POST method for /ai/jar/coaching
resource "aws_api_gateway_method" "ai_jar_coaching_post" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.ai_jar_coaching.id
  http_method   = "POST"
  authorization = "NONE"
}

# POST method for /ai/goal/coaching
resource "aws_api_gateway_method" "ai_goal_coaching_post" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.ai_goal_coaching.id
  http_method   = "POST"
  authorization = "NONE"
}

# POST method for /ai/qna/session
resource "aws_api_gateway_method" "ai_qna_session_post" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.ai_qna_session.id
  http_method   = "POST"
  authorization = "NONE"
}

# GET method for /auth/{id}
resource "aws_api_gateway_method" "auth_id_get" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.auth_id.id
  http_method   = "GET"
  authorization = "NONE"
}

# POST method for /auth/login
resource "aws_api_gateway_method" "auth_login_post" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.auth_login.id
  http_method   = "POST"
  authorization = "NONE"
}

# POST method for /auth/logout
resource "aws_api_gateway_method" "auth_logout_post" {
  rest_api_id   = aws_api_gateway_rest_api.test_api.id
  resource_id   = aws_api_gateway_resource.auth_logout.id
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

# Lambda integration for POST /transaction/search
resource "aws_api_gateway_integration" "transaction_search_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.transaction_search.id
  http_method = aws_api_gateway_method.transaction_search_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_transaction.invoke_arn
}

# Lambda integration for PATCH /transaction/{id}/classify
resource "aws_api_gateway_integration" "transaction_id_classify_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.transaction_id_classify.id
  http_method = aws_api_gateway_method.transaction_id_classify_patch.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_transaction.invoke_arn
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

# Lambda integration for POST /notification/search
resource "aws_api_gateway_integration" "notification_search_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.notification_search.id
  http_method = aws_api_gateway_method.notification_search_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_notification.invoke_arn
}

# Lambda integration for POST /notification/create
resource "aws_api_gateway_integration" "notification_create_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.notification_create.id
  http_method = aws_api_gateway_method.notification_create_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_notification.invoke_arn
}

# Lambda integration for PATCH /notification/{id}/status
resource "aws_api_gateway_integration" "notification_id_status_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.notification_id_status.id
  http_method = aws_api_gateway_method.notification_id_status_patch.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_notification.invoke_arn
}

# Lambda integration for POST /goal/search
resource "aws_api_gateway_integration" "goal_search_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.goal_search.id
  http_method = aws_api_gateway_method.goal_search_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_goal.invoke_arn
}

# Lambda integration for POST /goal/create
resource "aws_api_gateway_integration" "goal_create_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.goal_create.id
  http_method = aws_api_gateway_method.goal_create_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_goal.invoke_arn
}

# Lambda integration for POST /goal/allocate
resource "aws_api_gateway_integration" "goal_allocate_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.goal_allocate.id
  http_method = aws_api_gateway_method.goal_allocate_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_goal.invoke_arn
}


# Lambda integration for DELETE /goal/{id}
resource "aws_api_gateway_integration" "goal_id_delete_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.goal_id.id
  http_method = aws_api_gateway_method.goal_id_delete.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_goal.invoke_arn
}

# Lambda integration for POST /goal/set
resource "aws_api_gateway_integration" "goal_set_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.goal_set.id
  http_method = aws_api_gateway_method.goal_set_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_goal.invoke_arn
}

# Lambda integration for DELETE /goal/delete/{goal_id}
resource "aws_api_gateway_integration" "goal_delete_id_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.goal_delete_id.id
  http_method = aws_api_gateway_method.goal_delete_id_delete.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_goal.invoke_arn
}

# Lambda integration for PUT /goal/pause/{goal_id}
resource "aws_api_gateway_integration" "goal_pause_id_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.goal_pause_id.id
  http_method = aws_api_gateway_method.goal_pause_id_put.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_goal.invoke_arn
}

# Lambda integration for POST /ai/jar/coaching
resource "aws_api_gateway_integration" "ai_jar_coaching_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.ai_jar_coaching.id
  http_method = aws_api_gateway_method.ai_jar_coaching_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.ai_jar_coaching.invoke_arn
  timeout_milliseconds    = 60000
}

# Lambda integration for POST /ai/goal/coaching
resource "aws_api_gateway_integration" "ai_goal_coaching_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.ai_goal_coaching.id
  http_method = aws_api_gateway_method.ai_goal_coaching_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.ai_goal_coaching.invoke_arn
  timeout_milliseconds    = 60000
}

# Lambda integration for POST /ai/qna/session
resource "aws_api_gateway_integration" "ai_qna_session_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.ai_qna_session.id
  http_method = aws_api_gateway_method.ai_qna_session_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.ai_qna_session.invoke_arn
  timeout_milliseconds    = 60000
}

# Lambda integration for GET /auth/{id}
resource "aws_api_gateway_integration" "auth_id_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.auth_id.id
  http_method = aws_api_gateway_method.auth_id_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_user.invoke_arn
}

# Lambda integration for POST /auth/login
resource "aws_api_gateway_integration" "auth_login_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.auth_login.id
  http_method = aws_api_gateway_method.auth_login_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_user.invoke_arn
}

# Lambda integration for POST /auth/logout
resource "aws_api_gateway_integration" "auth_logout_lambda" {
  rest_api_id = aws_api_gateway_rest_api.test_api.id
  resource_id = aws_api_gateway_resource.auth_logout.id
  http_method = aws_api_gateway_method.auth_logout_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crud_user.invoke_arn
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

# Lambda permission for notification API Gateway
resource "aws_lambda_permission" "notification_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGatewayNotification"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.crud_notification.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.test_api.execution_arn}/*/*"
}

# Lambda permission for transaction API Gateway
resource "aws_lambda_permission" "transaction_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGatewayTransaction"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.crud_transaction.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.test_api.execution_arn}/*/*"
}

# Lambda permission for goal API Gateway
resource "aws_lambda_permission" "goal_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGatewayGoal"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.crud_goal.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.test_api.execution_arn}/*/*"
}

# Lambda permission for ai_jar_coaching API Gateway
resource "aws_lambda_permission" "ai_jar_coaching_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGatewayAIJarCoaching"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ai_jar_coaching.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.test_api.execution_arn}/*/*"
}

# Lambda permission for ai_goal_coaching API Gateway
resource "aws_lambda_permission" "ai_goal_coaching_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGatewayAIGoalCoaching"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ai_goal_coaching.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.test_api.execution_arn}/*/*"
}

# Lambda permission for ai_qna_session API Gateway
resource "aws_lambda_permission" "ai_qna_session_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGatewayAIQNASession"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ai_qna_session.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.test_api.execution_arn}/*/*"
}

# Lambda permission for crud_user API Gateway (for auth routes)
resource "aws_lambda_permission" "crud_user_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGatewayCRUDUser"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.crud_user.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.test_api.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "test" {
  depends_on = [
    aws_api_gateway_method.test_get,
    aws_api_gateway_integration.test_lambda,
    # Transaction routes
    aws_api_gateway_method.transaction_create_post,
    aws_api_gateway_integration.transaction_create_sqs,
    aws_api_gateway_method_response.transaction_create_post_200,
    aws_api_gateway_integration_response.transaction_create_sqs_200,
    aws_api_gateway_method.transaction_search_post,
    aws_api_gateway_integration.transaction_search_lambda,
    aws_api_gateway_method.transaction_id_classify_patch,
    aws_api_gateway_integration.transaction_id_classify_lambda,
    # Jar routes
    aws_api_gateway_method.jar_id_get,
    aws_api_gateway_integration.jar_id_lambda,
    aws_api_gateway_method.jar_initialize_post,
    aws_api_gateway_integration.jar_initialize_lambda,
    aws_api_gateway_method.jar_percent_put,
    aws_api_gateway_integration.jar_percent_lambda,
    # Notification routes
    aws_api_gateway_method.notification_search_post,
    aws_api_gateway_integration.notification_search_lambda,
    aws_api_gateway_method.notification_create_post,
    aws_api_gateway_integration.notification_create_lambda,
    aws_api_gateway_method.notification_id_status_patch,
    aws_api_gateway_integration.notification_id_status_lambda,
    # Goal routes
    aws_api_gateway_method.goal_search_post,
    aws_api_gateway_integration.goal_search_lambda,
    aws_api_gateway_method.goal_create_post,
    aws_api_gateway_integration.goal_create_lambda,
    aws_api_gateway_method.goal_allocate_post,
    aws_api_gateway_integration.goal_allocate_lambda,
    aws_api_gateway_method.goal_id_delete,
    aws_api_gateway_integration.goal_id_delete_lambda,
    aws_api_gateway_method.goal_set_post,
    aws_api_gateway_integration.goal_set_lambda,
    aws_api_gateway_method.goal_delete_id_delete,
    aws_api_gateway_integration.goal_delete_id_lambda,
    aws_api_gateway_method.goal_pause_id_put,
    aws_api_gateway_integration.goal_pause_id_lambda,
    # AI routes
    aws_api_gateway_method.ai_jar_coaching_post,
    aws_api_gateway_integration.ai_jar_coaching_lambda,
    aws_api_gateway_method.ai_goal_coaching_post,
    aws_api_gateway_integration.ai_goal_coaching_lambda,
    aws_api_gateway_method.ai_qna_session_post,
    aws_api_gateway_integration.ai_qna_session_lambda,
    # Auth routes
    aws_api_gateway_method.auth_id_get,
    aws_api_gateway_integration.auth_id_lambda,
    aws_api_gateway_method.auth_login_post,
    aws_api_gateway_integration.auth_login_lambda,
    aws_api_gateway_method.auth_logout_post,
    aws_api_gateway_integration.auth_logout_lambda,
  ]

  rest_api_id = aws_api_gateway_rest_api.test_api.id
  
  triggers = {
    redeployment = sha1(jsonencode([
      # Transaction resources
      aws_api_gateway_resource.transaction.id,
      aws_api_gateway_resource.transaction_create.id,
      aws_api_gateway_resource.transaction_search.id,
      aws_api_gateway_resource.transaction_id_classify.id,
      aws_api_gateway_method.transaction_create_post.id,
      aws_api_gateway_method.transaction_search_post.id,
      aws_api_gateway_method.transaction_id_classify_patch.id,
      aws_api_gateway_integration.transaction_create_sqs.id,
      aws_api_gateway_integration.transaction_search_lambda.id,
      aws_api_gateway_integration.transaction_id_classify_lambda.id,
      # Jar resources
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
      # Notification resources
      aws_api_gateway_resource.notification.id,
      aws_api_gateway_resource.notification_search.id,
      aws_api_gateway_resource.notification_create.id,
      aws_api_gateway_resource.notification_id_status.id,
      aws_api_gateway_method.notification_search_post.id,
      aws_api_gateway_method.notification_create_post.id,
      aws_api_gateway_method.notification_id_status_patch.id,
      aws_api_gateway_integration.notification_search_lambda.id,
      aws_api_gateway_integration.notification_create_lambda.id,
      aws_api_gateway_integration.notification_id_status_lambda.id,
      # Goal resources
      aws_api_gateway_resource.goal.id,
      aws_api_gateway_resource.goal_search.id,
      aws_api_gateway_resource.goal_create.id,
      aws_api_gateway_resource.goal_allocate.id,
      aws_api_gateway_resource.goal_id.id,
      aws_api_gateway_resource.goal_set.id,
      aws_api_gateway_resource.goal_delete.id,
      aws_api_gateway_resource.goal_delete_id.id,
      aws_api_gateway_resource.goal_pause.id,
      aws_api_gateway_resource.goal_pause_id.id,
      aws_api_gateway_method.goal_search_post.id,
      aws_api_gateway_method.goal_create_post.id,
      aws_api_gateway_method.goal_allocate_post.id,
      aws_api_gateway_method.goal_id_delete.id,
      aws_api_gateway_method.goal_set_post.id,
      aws_api_gateway_method.goal_delete_id_delete.id,
      aws_api_gateway_method.goal_pause_id_put.id,
      aws_api_gateway_integration.goal_search_lambda.id,
      aws_api_gateway_integration.goal_create_lambda.id,
      aws_api_gateway_integration.goal_allocate_lambda.id,
      aws_api_gateway_integration.goal_id_delete_lambda.id,
      aws_api_gateway_integration.goal_set_lambda.id,
      aws_api_gateway_integration.goal_delete_id_lambda.id,
      aws_api_gateway_integration.goal_pause_id_lambda.id,
      # AI resources
      aws_api_gateway_resource.ai.id,
      aws_api_gateway_resource.ai_jar.id,
      aws_api_gateway_resource.ai_jar_coaching.id,
      aws_api_gateway_resource.ai_goal.id,
      aws_api_gateway_resource.ai_goal_coaching.id,
      aws_api_gateway_resource.ai_qna.id,
      aws_api_gateway_resource.ai_qna_session.id,
      aws_api_gateway_method.ai_jar_coaching_post.id,
      aws_api_gateway_method.ai_goal_coaching_post.id,
      aws_api_gateway_method.ai_qna_session_post.id,
      aws_api_gateway_integration.ai_jar_coaching_lambda.id,
      aws_api_gateway_integration.ai_goal_coaching_lambda.id,
      aws_api_gateway_integration.ai_qna_session_lambda.id,
      # Auth resources
      aws_api_gateway_resource.auth.id,
      aws_api_gateway_resource.auth_id.id,
      aws_api_gateway_resource.auth_login.id,
      aws_api_gateway_resource.auth_logout.id,
      aws_api_gateway_method.auth_id_get.id,
      aws_api_gateway_method.auth_login_post.id,
      aws_api_gateway_method.auth_logout_post.id,
      aws_api_gateway_integration.auth_id_lambda.id,
      aws_api_gateway_integration.auth_login_lambda.id,
      aws_api_gateway_integration.auth_logout_lambda.id,
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