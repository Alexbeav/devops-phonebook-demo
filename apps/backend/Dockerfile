# Backend Dockerfile (Node.js/Express)
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
USER node
EXPOSE 5000
CMD ["node", "index.js"]
