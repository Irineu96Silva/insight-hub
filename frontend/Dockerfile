# InsightHub Frontend Dockerfile
# Multi-stage build for Quasar application

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables
ARG API_URL=http://localhost:3000

# Set environment variables for build
ENV VITE_API_URL=$API_URL

# Build the application
RUN npm run build

# ============================================
# Stage 3: Production with Nginx
# ============================================
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist/spa /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# ============================================
# Development Stage
# ============================================
FROM node:20-alpine AS development

WORKDIR /app

# Install Quasar CLI globally
RUN npm install -g @quasar/cli

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Start development server with hot reload
CMD ["quasar", "dev"]
