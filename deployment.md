# Deployment Guide

## Architecture Overview

```
Frontend (React/Vite) → Backend (Express) → API Gateway → Lambda → RDS
```

- **Frontend**: Served from S3 + CloudFront
- **Backend**: Deployed on ECS
- **Business Logic**: API Gateway + Lambda functions
- **Database**: RDS (MySQL)

## Local Development Setup

### 1. Environment Variables

#### Backend (.env)
```bash
# Copy from example
cp server/.env.example server/.env

# Edit with your values
API_GATEWAY_URL=https://your-api-gateway-url.execute-api.region.amazonaws.com/prod
JWT_SECRET=your-super-secret-jwt-key
PORT=5001
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

#### Frontend (.env)
```bash
# Copy from example
cp client/.env.example client/.env

# Edit with your values
VITE_API_URL=http://localhost:5001/api/v1
NODE_ENV=development
```

### 2. Run with Docker Compose

```bash
# Start both frontend and backend
docker-compose up --build

# Or run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Run Locally (without Docker)

#### Backend
```bash
cd server
npm install
npm start
```

#### Frontend
```bash
cd client
npm install
npm run dev
```

## Production Deployment

### 1. Frontend Deployment (S3 + CloudFront)

#### Prerequisites
- AWS S3 bucket for static files
- CloudFront distribution
- AWS CLI configured

#### Build and Deploy
```bash
# Build frontend
cd client
npm run build

# Deploy to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### 2. Backend Deployment (ECS)

#### Prerequisites
- ECR repository
- ECS cluster and service
- Application Load Balancer
- Environment variables configured in ECS

#### Build and Deploy
```bash
# Build and push Docker image
cd server
docker build -t your-ecr-repo:latest .
docker push your-ecr-repo:latest

# Deploy to ECS (or use GitHub Actions)
aws ecs update-service \
  --cluster your-cluster \
  --service your-service \
  --force-new-deployment
```

### 3. Using GitHub Actions (Recommended)

#### Setup Secrets
Configure these secrets in your GitHub repository:

**Frontend Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `S3_BUCKET_NAME`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `VITE_API_URL`

**Backend Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `ECR_REPOSITORY`
- `ECS_CLUSTER`
- `ECS_SERVICE`

#### Automatic Deployment
- Push to `main` branch triggers automatic deployment
- Frontend changes deploy to S3/CloudFront
- Backend changes deploy to ECS

## Environment Variables Reference

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| `API_GATEWAY_URL` | API Gateway endpoint | `https://xxx.execute-api.region.amazonaws.com/prod` |
| `JWT_SECRET` | Secret for JWT tokens | `your-secret-key` |
| `PORT` | Server port | `5001` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:5173` |
| `NODE_ENV` | Environment | `development` or `production` |

### Frontend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5001/api/v1` |
| `NODE_ENV` | Environment | `development` or `production` |

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `CORS_ORIGIN` in backend .env
   - Ensure frontend URL matches

2. **API Gateway Connection Issues**
   - Verify `API_GATEWAY_URL` is correct
   - Check AWS credentials and permissions

3. **Build Failures**
   - Ensure all environment variables are set
   - Check Node.js version compatibility

4. **Docker Issues**
   - Clear Docker cache: `docker system prune -a`
   - Rebuild images: `docker-compose build --no-cache`

### Logs and Debugging

```bash
# Backend logs
docker-compose logs backend

# Frontend logs
docker-compose logs frontend

# All logs
docker-compose logs -f

# ECS logs (production)
aws logs tail /ecs/your-service --follow
```

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files to git
   - Use AWS Secrets Manager for production secrets

2. **CORS Configuration**
   - Restrict origins in production
   - Use HTTPS in production

3. **JWT Tokens**
   - Use strong secrets
   - Implement token expiration
   - Validate tokens on all protected routes

4. **API Gateway**
   - Use API keys if needed
   - Implement rate limiting
   - Monitor usage and costs

