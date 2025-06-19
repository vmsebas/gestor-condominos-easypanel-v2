# Single stage build - more efficient for space
FROM node:18-alpine

# Set production environment early
ENV NODE_ENV=production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (dev + prod) for build
RUN npm ci --omit=optional

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Clean npm cache
RUN npm cache clean --force

# Remove source files, keep only built files and server
RUN rm -rf src/ && \
    rm -rf .git/ && \
    rm -rf documentos/ && \
    rm -rf test-*.html && \
    rm -rf *.md && \
    rm -rf tsconfig*.json && \
    rm -rf vite.config.ts && \
    rm -rf postcss.config.js && \
    rm -rf tailwind.config.ts

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 3002

# Start the production server
CMD ["node", "server/production-server.cjs"]