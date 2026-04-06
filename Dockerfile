# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files from jludating-api subdirectory
COPY jludating-api/package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source code
COPY jludating-api/ ./

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY jludating-api/package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy built application
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]
