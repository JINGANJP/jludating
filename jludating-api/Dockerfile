FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY jludating-api/package*.json ./
COPY jludating-api/prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Start the application
CMD ["npm", "run", "start:prod"]