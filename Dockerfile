# syntax=docker/dockerfile:1

# --- Build stage: compile the Vite app to static files ---
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies against the lockfile for reproducible builds.
COPY package.json package-lock.json ./
RUN npm ci

# Build the production bundle.
COPY . .
RUN npm run build

# --- Serve stage: tiny nginx image serving the static build ---
FROM nginx:1.27-alpine AS serve

# Cloud Run provides $PORT (defaults to 8080). nginx's base image renders any
# /etc/nginx/templates/*.template files with envsubst at startup.
ENV PORT=8080

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 8080

# The nginx base image's entrypoint processes the template and starts nginx.
CMD ["nginx", "-g", "daemon off;"]
