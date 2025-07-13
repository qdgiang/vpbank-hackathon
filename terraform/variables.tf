variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-2"
}

variable "aws_access_key_id" {
  description = "AWS Access Key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS Secret Access Key"
  type        = string
  sensitive   = true
}

variable "s3_crawl_bucket_name" {
  description = "The name of the S3 bucket to store web crawling results."
  type        = string
  default     = "vpb-finserv-web"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "smart-jarvis"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Initial allocated storage for RDS"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "vpbank_db"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
  default     = "12345678aA"
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot when deleting RDS instance"
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

variable "bastion_public_key" {
  description = "Public key for bastion host SSH access"
  type        = string
}

variable "bastion_instance_type" {
  description = "EC2 instance type for bastion host"
  type        = string
  default     = "t2.micro"
}

# Bedrock Configuration
variable "bedrock_model_id" {
  description = "The model ID for the Bedrock Converse API"
  type        = string
  default     = "arn:aws:bedrock:ap-southeast-2:055029294644:inference-profile/apac.anthropic.claude-sonnet-4-20250514-v1:0"
}

variable "bedrock_kb_id" {
  description = "The knowledge base ID for the Bedrock Converse API"
  type        = string
  default     = "TARE1HFTXP"
}

# --- Lambda Configuration ---
variable "python_runtime" {
  description = "Python runtime for Lambda functions"
  type        = string
  default     = "python3.9"
}

variable "lambda_timeout" {
  description = "Default timeout for Lambda functions in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "Default memory size for Lambda functions in MB"
  type        = number
  default     = 256
}