# Stage 1: install all deps (needed for build with monorepo packages)
FROM node:20-alpine AS deps
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --frozen-lockfile

# Stage 2: build
FROM node:20-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY packages/ ./packages/
COPY apps/backend/ ./apps/backend/
COPY package.json pnpm-workspace.yaml ./
WORKDIR /app/apps/backend
RUN pnpm build

# Stage 3: production image
FROM node:20-alpine AS runner
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY apps/backend/prisma ./apps/backend/prisma
WORKDIR /app/apps/backend
EXPOSE 3000
CMD ["node", "dist/main"]
