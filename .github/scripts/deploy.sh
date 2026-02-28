#!/bin/bash
set -e

# Script variables will be passed from GitHub Actions
# Required env vars:
# - BACKEND_IMAGE, FRONTEND_IMAGE
# - DEPLOY_PATH, ENV_NAME
# - BACKEND_PORT, FRONTEND_PORT
# - BRANCH_NAME
# - BACKEND_CHANGED, FRONTEND_CHANGED
# - GITHUB_TOKEN, GITHUB_ACTOR

echo "🚀 Starting $ENV_NAME deployment..."
echo "📊 Changes detected:"
echo "   Backend: $BACKEND_CHANGED"
echo "   Frontend: $FRONTEND_CHANGED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Determine compose files based on environment
if [[ "$BRANCH_NAME" == "UAT" ]]; then
  BE_COMPOSE="docker-compose.backend.uat.yml"
  FE_COMPOSE="docker-compose.frontend.uat.yml"
  PROJECT_NAME="agms-uat"
  CONTAINER_SUFFIX="uat"
else
  BE_COMPOSE="docker-compose.backend.prod.yml"
  FE_COMPOSE="docker-compose.frontend.prod.yml"
  PROJECT_NAME="agms-prod"
  CONTAINER_SUFFIX="prod"
fi

echo "📄 Backend compose: $BE_COMPOSE"
echo "📄 Frontend compose: $FE_COMPOSE"
echo "📦 Project: $PROJECT_NAME"

# Login to GHCR
echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin

cd "$DEPLOY_PATH"

# Ensure networks exist
echo "🌐 Ensuring networks exist..."
docker network create agms-network 2>/dev/null || echo "Network agms-network exists"
docker network create agms-network-uat 2>/dev/null || echo "Network agms-network-uat exists"

# Cleanup ports
echo "🧹 Cleaning up ports..."
lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true

# Skip if no changes
if [[ "$BACKEND_CHANGED" == "false" ]] && [[ "$FRONTEND_CHANGED" == "false" ]]; then
  echo "⏭️  No changes, skipping"
  exit 0
fi

# Deploy Backend
if [[ "$BACKEND_CHANGED" == "true" ]]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔧 DEPLOYING BACKEND"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # Pull image with retry
  for i in {1..3}; do
    if docker pull "$BACKEND_IMAGE"; then
      echo "✅ Pull successful"
      break
    fi
    echo "⚠️  Retry $i/3..."
    sleep 5
  done
  
  # Deploy
  docker rm -f "agms-backend-${CONTAINER_SUFFIX}" 2>/dev/null || true
  docker-compose -p "$PROJECT_NAME" -f "$BE_COMPOSE" up -d
  
  # Health check
  echo "🧪 Health check..."
  for i in {1..15}; do
    if curl -sf "http://localhost:$BACKEND_PORT/health" >/dev/null; then
      echo "✅ Backend healthy"
      break
    fi
    echo "⏳ Waiting... ($i/15)"
    sleep 2
  done
fi

# Deploy Frontend
if [[ "$FRONTEND_CHANGED" == "true" ]]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🌐 DEPLOYING FRONTEND"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # Pull image with retry
  for i in {1..3}; do
    if docker pull "$FRONTEND_IMAGE"; then
      echo "✅ Pull successful"
      break
    fi
    echo "⚠️  Retry $i/3..."
    sleep 5
  done
  
  # Deploy
  docker rm -f "agms-frontend-${CONTAINER_SUFFIX}" 2>/dev/null || true
  docker-compose -p "$PROJECT_NAME" -f "$FE_COMPOSE" up -d
  
  # Health check
  echo "🧪 Health check..."
  for i in {1..10}; do
    if curl -sf "http://localhost:$FRONTEND_PORT" >/dev/null; then
      echo "✅ Frontend healthy"
      break
    fi
    echo "⏳ Waiting... ($i/10)"
    sleep 2
  done
fi

# Status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 CONTAINER STATUS"
docker ps --filter name=agms --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📦 Images:"
docker images | grep agms

# Cleanup dangling images
echo ""
echo "🧹 Cleanup..."
docker image prune -f

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ $ENV_NAME Deployment Completed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Frontend: http://YOUR_SERVER:$FRONTEND_PORT"
echo "🔧 Backend:  http://YOUR_SERVER:$BACKEND_PORT"
echo "📚 Swagger:  http://YOUR_SERVER:$BACKEND_PORT/swagger"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
