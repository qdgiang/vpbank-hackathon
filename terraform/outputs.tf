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

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.transaction_query.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.transaction_query.arn
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