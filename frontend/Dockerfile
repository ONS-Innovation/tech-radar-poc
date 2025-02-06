FROM node:18-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Add build argument for NODE_ENV
ARG NODE_ENV="production"
# Make NODE_ENV available at runtime too
ENV NODE_ENV=$NODE_ENV
# Add Node memory settings for both build and runtime
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Install serve globally if production
RUN if [ "$NODE_ENV" = "production" ]; then \
        npm install -g serve; \
    fi

# Set up npm cache directory
RUN mkdir -p /app/.npm

# Copy package files first
COPY package*.json ./

# Install dependencies with production flag for smaller footprint
RUN npm ci --legacy-peer-deps --only=production && \
    npm cache clean --force && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Copy the rest of the application files
COPY --chown=appuser:appgroup . .

# Build for production or start dev server based on NODE_ENV
# For production, we'll build with increased memory limit
CMD if [ "$NODE_ENV" = "production" ]; then \
        export NODE_OPTIONS="--max-old-space-size=2048" && \
        npm run build && \
        serve -s build -l 3000; \
    else \
        npm start; \
    fi

EXPOSE 3000