FROM node:16-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Add build argument for NODE_ENV
ARG NODE_ENV="production"
# Make NODE_ENV available at runtime too
ENV NODE_ENV=$NODE_ENV

# Install serve globally if production (do this before switching to non-root user)
RUN if [ "$NODE_ENV" = "production" ]; then \
        npm install -g serve; \
    fi

# Copy package files first
COPY package*.json ./

# Set correct ownership and permissions
RUN chown -R appuser:appgroup /app && \
    mkdir -p /home/appuser/.npm && \
    chown -R appuser:appgroup /home/appuser/.npm

# Switch to non-root user
USER appuser

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy the rest of the application files
COPY --chown=appuser:appgroup . .

# Build for production or start dev server based on NODE_ENV
CMD if [ "$NODE_ENV" = "production" ]; then \
        npm run build && serve -s build -l 3000; \
    else \
        npm start; \
    fi

EXPOSE 3000