# Terraform PostgreSQL on AWS

This Terraform configuration sets up a PostgreSQL RDS instance on AWS with the following components:

## Architecture

- **VPC**: Custom VPC with public and private subnets across 2 availability zones
- **RDS**: PostgreSQL 15.7 instance in private subnets with encryption enabled
- **Security Groups**: Configured to allow database access from within the VPC
- **Backup**: Automated backups with configurable retention period

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform installed (>= 1.0)

## Usage

1. Copy the example variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` with your desired values, especially:
   - `db_password`: Set a secure password
   - `aws_region`: Choose your preferred region
   - `project_name`: Customize the project name

3. Initialize Terraform:
   ```bash
   terraform init
   ```

4. Plan the deployment:
   ```bash
   terraform plan
   ```

5. Apply the configuration:
   ```bash
   terraform apply
   ```

## Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS region | `us-east-1` |
| `project_name` | Project name prefix | `vpbank-hackathon` |
| `db_instance_class` | RDS instance type | `db.t3.micro` |
| `db_allocated_storage` | Initial storage (GB) | `20` |
| `db_max_allocated_storage` | Max storage (GB) | `100` |
| `db_name` | Database name | `vpbank_db` |
| `db_username` | Database username | `postgres` |
| `db_password` | Database password | *Required* |
| `backup_retention_period` | Backup retention (days) | `7` |
| `skip_final_snapshot` | Skip final snapshot | `true` |
| `deletion_protection` | Enable deletion protection | `false` |

## Outputs

After deployment, you'll get:
- VPC and subnet IDs
- RDS endpoint and port
- Database name and username
- Security group ID

## Security Notes

- Database is deployed in private subnets (no direct internet access)
- Encryption at rest is enabled
- Security group restricts access to VPC CIDR only
- Consider enabling deletion protection for production

## Cleanup

To destroy the infrastructure:
```bash
terraform destroy
```