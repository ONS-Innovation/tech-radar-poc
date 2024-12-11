FROM node:16-alpine as builder
WORKDIR /app

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

# Build the application
RUN npm run build

# Production stage
FROM node:16-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Install serve for production static file serving
RUN npm install -g serve

# Copy only the built files
COPY --from=builder --chown=appuser:appgroup /app/build ./build

USER appuser

EXPOSE 3000

# Serve the static files
CMD ["serve", "-s", "build", "-l", "3000"]