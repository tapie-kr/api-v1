FROM node:23-bookworm-slim AS builder

COPY . /app
WORKDIR /app

ENV TZ=Asia/Seoul

# Build argument for DATABASE_URL (needed for Prisma generate)
ARG DATABASE_URL

RUN apt-get update -y && apt-get install -y openssl

RUN corepack enable
RUN corepack prepare pnpm --activate
RUN pnpm install --frozen-lockfile

EXPOSE 8877

WORKDIR /app/packages/database
# Set DATABASE_URL as environment variable for Prisma generate
ENV DATABASE_URL=${DATABASE_URL}
RUN pnpm run generate

WORKDIR /app/packages/api
RUN pnpm run build

RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
