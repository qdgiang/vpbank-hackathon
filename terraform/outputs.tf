output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.mysql.endpoint
}

output "rds_port" {
  description = "RDS port"
  value       = aws_db_instance.mysql.port
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.mysql.db_name
}

output "database_username" {
  description = "Database username"
  value       = aws_db_instance.mysql.username
  sensitive   = true
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}

# CRUD Test Lambda outputs
output "crud_test_lambda_name" {
  description = "CRUD Test Lambda function name"
  value       = aws_lambda_function.crud_test.function_name
}

output "crud_test_lambda_arn" {
  description = "CRUD Test Lambda function ARN"
  value       = aws_lambda_function.crud_test.arn
}

# CRUD Transaction Lambda outputs
output "crud_transaction_lambda_name" {
  description = "CRUD Transaction Lambda function name"
  value       = aws_lambda_function.crud_transaction.function_name
}

output "crud_transaction_lambda_arn" {
  description = "CRUD Transaction Lambda function ARN"
  value       = aws_lambda_function.crud_transaction.arn
}

# CRUD Jar Lambda outputs
output "crud_jar_lambda_name" {
  description = "CRUD Jar Lambda function name"
  value       = aws_lambda_function.crud_jar.function_name
}

output "crud_jar_lambda_arn" {
  description = "CRUD Jar Lambda function ARN"
  value       = aws_lambda_function.crud_jar.arn
}

# CRUD Notification Lambda outputs
output "crud_notification_lambda_name" {
  description = "CRUD Notification Lambda function name"
  value       = aws_lambda_function.crud_notification.function_name
}

output "crud_notification_lambda_arn" {
  description = "CRUD Notification Lambda function ARN"
  value       = aws_lambda_function.crud_notification.arn
}

output "lambda_role_arn" {
  description = "Lambda execution role ARN"
  value       = aws_iam_role.lambda_execution.arn
}

output "bastion_public_ip" {
  description = "Bastion host public IP"
  value       = aws_instance.bastion.public_ip
}

output "bastion_ssh_command" {
  description = "SSH command to connect to bastion host"
  value       = "ssh -i ~/.ssh/{key_name} ec2-user@${aws_instance.bastion.public_ip}"
}

output "db_connection_command" {
  description = "mysql command to connect to database via bastion"
  value       = "mysql -h ${aws_db_instance.mysql.endpoint} -u ${aws_db_instance.mysql.username} -p ${aws_db_instance.mysql.db_name}"
}

# Query Test API Gateway outputs
output "crud_test_api_gateway_id" {
  description = "CRUD Test API Gateway ID"
  value       = aws_api_gateway_rest_api.test_api.id
}

output "crud_test_api_gateway_url" {
  description = "CRUD Test API Gateway URL"
  value       = "https://${aws_api_gateway_rest_api.test_api.id}.execute-api.${var.aws_region}.amazonaws.com/v1/test"
}

# SQS and API Gateway outputs
output "transactions_queue_url" {
  description = "SQS FIFO Queue URL"
  value       = aws_sqs_queue.transactions_fifo.url
}

output "transactions_queue_arn" {
  description = "SQS FIFO Queue ARN"
  value       = aws_sqs_queue.transactions_fifo.arn
}

output "transactions_api_url" {
  description = "API Gateway URL for transactions queue"
  value       = "https://${aws_api_gateway_rest_api.test_api.id}.execute-api.${var.aws_region}.amazonaws.com/v1/transaction/create"
}

output "sqs_processor_lambda_name" {
  description = "SQS Processor Lambda function name"
  value       = aws_lambda_function.sqs_processor.function_name
}

output "sqs_processor_lambda_arn" {
  description = "SQS Processor Lambda function ARN"
  value       = aws_lambda_function.sqs_processor.arn
}

# CRUD User Lambda outputs
output "crud_user_lambda_name" {
  description = "CRUD User Lambda function name"
  value       = aws_lambda_function.crud_user.function_name
}

output "crud_user_lambda_arn" {
  description = "CRUD User Lambda function ARN"
  value       = aws_lambda_function.crud_user.arn
}

# CRUD Goal Lambda outputs
output "crud_goal_lambda_name" {
  description = "CRUD Goal Lambda function name"
  value       = aws_lambda_function.crud_goal.function_name
}

output "crud_goal_lambda_arn" {
  description = "CRUD Goal Lambda function ARN"
  value       = aws_lambda_function.crud_goal.arn
}

output "crud_test_api_gateway_name" {
  description = "CRUD Test API Gateway name"
  value       = aws_api_gateway_rest_api.test_api.name
}