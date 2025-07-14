# Configure Docker provider
provider "docker" {
  registry_auth {
    address  = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
    username = "AWS"
    password = data.aws_ecr_authorization_token.token.password
  }
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Get ECR authorization token
data "aws_ecr_authorization_token" "token" {
  registry_id = data.aws_caller_identity.current.account_id
}

# Build Docker image
resource "docker_image" "vpbank_server" {
  name = "${aws_ecr_repository.vpbank_server.repository_url}:latest"
  
  build {
    context = "${path.module}/../server"
    dockerfile = "Dockerfile"
  }
  
  triggers = {
    server_code = filemd5("${path.module}/../server/index.js")
    dockerfile  = filemd5("${path.module}/../server/Dockerfile")
    package_json = filemd5("${path.module}/../server/package.json")
  }

  depends_on = [aws_ecr_repository.vpbank_server]
}

# Push Docker image to ECR
resource "docker_registry_image" "vpbank_server" {
  name = docker_image.vpbank_server.name
  
  triggers = {
    image_id = docker_image.vpbank_server.id
  }
}