# Dockerfile.dev for development
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5001
CMD ["npx", "nodemon", "index.js"] 