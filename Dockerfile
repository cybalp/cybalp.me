# ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ❯ @status OK!
# ❯ @path ./Dockerfile
# ❯ @desc Multi-stage Docker build for Astro blog
# ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

# ❯ BUILD STAGE
FROM node:lts-alpine AS builder

# ❯ SETUP
WORKDIR /app
RUN corepack enable
ENV NODE_OPTIONS=--no-deprecation

# ❯ DEPENDENCIES
COPY package.json pnpm-lock.yaml ./
COPY .npmrc ./
RUN pnpm install --frozen-lockfile --prefer-offline

# ❯ BUILD
COPY . .
RUN pnpm build

# ❯ RUNTIME STAGE
FROM nginx:alpine

# ❯ DEPLOYMENT
COPY --from=builder /app/dist /usr/share/nginx/html

# ❯ EXPOSE
EXPOSE 80

# ❯ METADATA
LABEL org.opencontainers.image.source="https://github.com/cybalp/cybalp.me"
LABEL org.opencontainers.image.description="CybAlp blog Docker image"
LABEL org.opencontainers.image.licenses="MIT"
