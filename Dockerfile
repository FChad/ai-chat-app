FROM node:24-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production runtime — only the compiled output is needed
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.output ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:3000/ || exit 1

CMD ["node", "server/index.mjs"]
