# Build stage
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
# Install dependencies including dev dependencies
RUN npm install

COPY . .
# Build for production
RUN npm run build

# Production stage
FROM nginx:alpine
# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*
# Copy static assets from builder
COPY --from=build /app/build /usr/share/nginx/html/
# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Ensure proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80
# Make sure nginx runs in the foreground
CMD ["nginx", "-g", "daemon off;"] 