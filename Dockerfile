FROM node:18-alpine

# Set development environment for build stage
ENV NODE_ENV=development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies including devDependencies
# Force npm to install everything needed for the build
RUN npm install

# Copy everything
COPY . .

# Build the frontend
RUN npm run build

# Set production environment after build
ENV NODE_ENV=production

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose ports
EXPOSE 3002 5173

# Start both servers
CMD ["/bin/sh", "./start-docker.sh"]
