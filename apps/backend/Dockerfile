# Backend Dockerfile (Node.js/Express)
FROM node:25-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:25-alpine
# apk upgrade picks up OS security patches (e.g. openssl) ahead of the base
# image tag; the bundled npm CLI is removed because the runtime never uses it
# (migrations run 'node migrate.js') and its vendored deps trip image scans.
RUN apk --no-cache upgrade \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json app.js index.js migrate.js ./
USER node
EXPOSE 5000
CMD ["node", "index.js"]
