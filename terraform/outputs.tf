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

# Query Test Lambda outputs
output "query_test_lambda_name" {
  description = "Query Test Lambda function name"
  value       = aws_lambda_function.query_test.function_name
}

output "query_test_lambda_arn" {
  description = "Query Test Lambda function ARN"
  value       = aws_lambda_function.query_test.arn
}

# Query Transaction Lambda outputs
output "query_transaction_lambda_name" {
  description = "Query Transaction Lambda function name"
  value       = aws_lambda_function.query_transaction.function_name
}

output "query_transaction_lambda_arn" {
  description = "Query Transaction Lambda function ARN"
  value       = aws_lambda_function.query_transaction.arn
}

# Query Jar Lambda outputs
output "query_jar_lambda_name" {
  description = "Query Jar Lambda function name"
  value       = aws_lambda_function.query_jar.function_name
}

output "query_jar_lambda_arn" {
  description = "Query Jar Lambda function ARN"
  value       = aws_lambda_function.query_jar.arn
}

# Query Notification Lambda outputs
output "query_notification_lambda_name" {
  description = "Query Notification Lambda function name"
  value       = aws_lambda_function.query_notification.function_name
}

output "query_notification_lambda_arn" {
  description = "Query Notification Lambda function ARN"
  value       = aws_lambda_function.query_notification.arn
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
output "query_test_api_gateway_id" {
  description = "Query Test API Gateway ID"
  value       = aws_api_gateway_rest_api.test_api.id
}

output "query_test_api_gateway_url" {
  description = "Query Test API Gateway URL"
  value       = "https://${aws_api_gateway_rest_api.test_api.id}.execute-api.${var.aws_region}.amazonaws.com/api/test"
}

output "query_test_api_gateway_name" {
  description = "Query Test API Gateway name"
  value       = aws_api_gateway_rest_api.test_api.name
}