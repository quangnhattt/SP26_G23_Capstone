# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files (yarn)
COPY package.json yarn.lock* ./

# Install ALL dependencies using yarn
RUN corepack enable && yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Production stage with Nginx
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
