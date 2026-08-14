FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Unprivileged nginx: runs as uid 101, listens on 8080, and keeps its pid /
# temp paths under /tmp - which lets the pod run with readOnlyRootFilesystem.
FROM nginxinc/nginx-unprivileged:alpine
# apk needs root; drop back to the unprivileged uid before CMD.
USER root
RUN apk --no-cache upgrade
USER 101
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 8080
