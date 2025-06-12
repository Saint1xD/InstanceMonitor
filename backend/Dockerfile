FROM node:18-alpine AS base

RUN apk update && apk upgrade

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
