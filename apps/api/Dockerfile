# Development Dockerfile for API
FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Enable pnpm
RUN corepack enable

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Expose port from environment variable
EXPOSE ${API_PORT}

# Start development server
CMD ["pnpm", "start:dev"]