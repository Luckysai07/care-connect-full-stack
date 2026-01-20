# Build Stage
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build the app (Vite)
RUN npm run build

# Production Stage (Nginx)
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config if we had one (using default for now, but enabling SPA fallback)
# We need a simple config to handle React Router (SPA) 404s
RUN echo 'server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

# Start Nginx causing it to write config.js first
CMD ["/bin/sh", "-c", "echo \"window.__RUNTIME_CONFIG__ = { API_URL: '${VITE_API_URL:-http://localhost:5000/api}', SOCKET_URL: '${VITE_SOCKET_URL:-http://localhost:5000}' };\" > /usr/share/nginx/html/config.js && nginx -g 'daemon off;'"]
