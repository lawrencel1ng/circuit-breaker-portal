# Use Node.js 18 Alpine as base image
FROM node:22-alpine AS builder

# Install OpenSSL for Prisma
RUN apk -U add openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
# adapter-node is already in package.json devDependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Update svelte.config.js to use adapter-node for Docker
RUN sed -i "s/@sveltejs\/adapter-auto/@sveltejs\/adapter-node/g" svelte.config.js

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine

# Install OpenSSL for Prisma
RUN apk -U add openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci

# Install Prisma CLI and tsx for database operations
RUN npm install prisma tsx

# Copy built application from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create data directory for persistent storage
RUN mkdir -p /app/data

# Expose port 3000
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Start the application using node
CMD ["sh", "-c", "npx prisma db push && npx prisma db seed && node build"]
