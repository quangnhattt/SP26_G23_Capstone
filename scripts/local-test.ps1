# PowerShell script để test docker compose local trên Windows
# Usage: .\scripts\local-test.ps1

Write-Host "🧪 Starting local Docker Compose test..." -ForegroundColor Cyan
Write-Host ""

# Kiểm tra Docker đã cài đặt
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Kiểm tra file .env
if (-not (Test-Path .env)) {
    Write-Host "⚠️  .env file not found, creating from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✏️  Please update .env file with your settings" -ForegroundColor Yellow
}

# Build images locally
Write-Host "🔨 Building Docker images..." -ForegroundColor Cyan
docker-compose build

# Start services
Write-Host "▶️  Starting services..." -ForegroundColor Cyan
docker-compose up -d

# Wait for services
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

# Check health
Write-Host "🏥 Checking service health..." -ForegroundColor Cyan
Write-Host ""

# Check database
$dbStatus = docker-compose ps | Select-String "agms-database.*Up"
if ($dbStatus) {
    Write-Host "✅ Database is running" -ForegroundColor Green
} else {
    Write-Host "❌ Database failed to start" -ForegroundColor Red
    docker-compose logs database
}

# Check backend
$beStatus = docker-compose ps | Select-String "agms-backend.*Up"
if ($beStatus) {
    Write-Host "✅ Backend is running" -ForegroundColor Green
    Write-Host "   Testing backend endpoint..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/swagger/index.html" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ Backend API is responding" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ⚠️  Backend API not responding yet (may need more time)" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Backend failed to start" -ForegroundColor Red
    docker-compose logs backend
}

# Check frontend
$feStatus = docker-compose ps | Select-String "agms-frontend.*Up"
if ($feStatus) {
    Write-Host "✅ Frontend is running" -ForegroundColor Green
    Write-Host "   Testing frontend..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:80" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ Frontend is responding" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ⚠️  Frontend not responding yet" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Frontend failed to start" -ForegroundColor Red
    docker-compose logs frontend
}

Write-Host ""
Write-Host "📊 Container status:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "📋 Available commands:" -ForegroundColor Cyan
Write-Host "   docker-compose logs -f          # Xem logs"
Write-Host "   docker-compose logs -f backend  # Xem logs backend"
Write-Host "   docker-compose down             # Dừng tất cả services"
Write-Host "   docker-compose restart backend  # Restart backend"
Write-Host ""
Write-Host "🌐 Access URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:80"
Write-Host "   Backend:  http://localhost:8080"
Write-Host "   Swagger:  http://localhost:8080/swagger"
