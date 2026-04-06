FROM node:22-alpine

WORKDIR /app

# Copy package files first for better caching
COPY jludating-api/package*.json ./
COPY jludating-api/prisma ./prisma/

# Install dependencies
RUN npm install --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# Copy source and build
COPY jludating-api/tsconfig*.json ./
COPY jludating-api/nest-cli.json ./
COPY jludating-api/src ./src

RUN npm run build

# Start the application
CMD ["npm", "run", "start:prod"]