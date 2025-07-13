# SQS FIFO Queue for Transactions
resource "aws_sqs_queue" "transactions_fifo" {
  name                        = "transactions-queue.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  
  tags = {
    Name = "transactions-fifo-queue"
  }
}

# IAM Role for API Gateway to access SQS
resource "aws_iam_role" "api_gateway_sqs_role" {
  name = "api-gateway-sqs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "api-gateway-sqs-role"
  }
}

# IAM Policy for API Gateway to send messages to SQS
resource "aws_iam_policy" "api_gateway_sqs_policy" {
  name = "api-gateway-sqs-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.transactions_fifo.arn
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "api_gateway_sqs_attachment" {
  role       = aws_iam_role.api_gateway_sqs_role.name
  policy_arn = aws_iam_policy.api_gateway_sqs_policy.arn
}