# Multi-stage build для frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Копирование package файлов
COPY package*.json ./
RUN npm ci

# Копирование исходников и сборка
COPY . .
RUN npm run build:prod

# Production образ для frontend (Nginx)
FROM nginx:alpine AS frontend

COPY --from=frontend-builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
