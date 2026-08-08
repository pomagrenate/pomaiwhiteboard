# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install emscripten & build tools if building WASM from scratch
RUN apk add --no-exe bash build-base emscripten

COPY package.json yarn.lock ./
COPY packages ./packages
COPY pomaiwhiteboard-app ./pomaiwhiteboard-app

RUN yarn install --frozen-lockfile
RUN yarn build

# Stage 2: Production Nginx stage
FROM nginx:alpine-slim

COPY --from=builder /app/pomaiwhiteboard-app/build /usr/share/nginx/html

RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
