# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Run the application
FROM node:18-alpine

# Install ffmpeg
RUN apk add --no-cache ffmpeg

# Set working directory
WORKDIR /app

# Copy node_modules and build from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Install production dependencies
RUN npm ci --only=production

# Add this line at the top of your Dockerfile
ARG DATABASE_URL

# Update the Prisma datasource in the schema to use the build argument
RUN echo "DATABASE_URL=${DATABASE_URL}" > .env

# Copy the .env file
COPY .env ./

# Run Prisma migrations
RUN npx prisma migrate deploy

# Expose port
EXPOSE 4000

# Set environment variable to indicate production
ENV NODE_ENV production

# Start the application
CMD ["npm", "run", "start"]
