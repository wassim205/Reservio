# Development Dockerfile for Web
FROM node:20-alpine

# Enable pnpm
RUN corepack enable

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

# Copy source code
COPY . .

# Expose port from environment variable
EXPOSE ${WEB_PORT}

# Start development server
CMD ["pnpm", "dev"]