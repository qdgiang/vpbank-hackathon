FROM node:20-alpine

WORKDIR /app

COPY ./package.json ./package-lock.json ./
RUN npm ci

COPY ./public ./public
COPY ./src ./src
COPY ./index.html ./index.html
COPY ./vite.config.js ./vite.config.js
#COPY ./.env ./.env

EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host"]
