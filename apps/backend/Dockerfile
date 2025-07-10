# Backend Dockerfile (Node.js/Express)
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production
COPY . .
CMD npm run migrate && npm start