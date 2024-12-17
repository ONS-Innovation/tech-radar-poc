# backend/Dockerfile
FROM node:18-alpine as builder
WORKDIR /app

# Install wget before creating non-root user
RUN apk add --no-cache wget

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files first
COPY package*.json ./

# Set correct ownership and permissions
RUN chown -R appuser:appgroup /app && \
    mkdir -p /home/appuser/.npm && \
    chown -R appuser:appgroup /home/appuser/.npm

# Switch to non-root user
USER appuser

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application files
COPY --chown=appuser:appgroup . .

# Production stage
FROM node:18-alpine
WORKDIR /app

# Install wget in the final image before switching to non-root user
RUN apk add --no-cache wget

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only the necessary files
COPY --from=builder --chown=appuser:appgroup /app/package*.json ./
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/src ./src

USER appuser

EXPOSE 5001

# Run in production mode
CMD ["node", "src/index.js"]