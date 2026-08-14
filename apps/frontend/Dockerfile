FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
# Pick up OS security patches ahead of the base image tag
RUN apk --no-cache upgrade
COPY --from=builder /app/dist /usr/share/nginx/html
