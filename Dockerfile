# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies without Python/build tools first
RUN npm ci --silent

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --production --silent && npm cache clean --force

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