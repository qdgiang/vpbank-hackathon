# Terraform State Backend

This directory contains the infrastructure for storing Terraform state remotely using S3 and DynamoDB.

## Usage

1. **Initialize and apply the backend resources:**
   ```bash
   cd terraform/state_backend
   terraform init
   terraform apply
   ```

2. **Get the backend configuration:**
   ```bash
   terraform output backend_configuration
   ```

3. **Configure the main Terraform to use remote backend:**
   - Copy the output values to your main `main.tf` backend configuration
   - Run `terraform init` to migrate state

## Resources Created

- **S3 Bucket**: Stores Terraform state files with versioning and encryption
- **DynamoDB Table**: Provides state locking to prevent concurrent modifications

## Security Features

- S3 bucket encryption enabled
- S3 bucket versioning enabled
- Public access blocked on S3 bucket
- DynamoDB table for state locking