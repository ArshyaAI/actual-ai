# Simplified Dockerfile for Swiss Bookkeeping Agent
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json ./
COPY frontend/package.json ./frontend/

# Install dependencies
RUN npm install
RUN cd frontend && npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build
RUN cd frontend && npm run build

# Create necessary directories
RUN mkdir -p temp exports

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
