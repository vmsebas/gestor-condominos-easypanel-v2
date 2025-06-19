# Build stage
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --production && npm cache clean --force

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy server files
COPY --from=builder /app/server ./server

# Copy migration files (needed for runtime)
COPY --from=builder /app/src/db/migrations ./src/db/migrations

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 3002

# Set production environment
ENV NODE_ENV=production

# Start the production server
CMD ["node", "server/production-server.cjs"]