# 🚗 Advanced Garage Management System (AGMS)

> **SP26_G23_Capstone** - Hệ thống quản lý garage ô tô hiện đại

[![CI/CD](https://github.com/quangnhattt/SP26_G23_Capstone/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/quangnhattt/SP26_G23_Capstone/actions/workflows/ci-cd.yml)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![.NET](https://img.shields.io/badge/.NET-8.0-purple)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-19.2-61dafb)](https://reactjs.org/)

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tech Stack](#-tech-stack)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt](#-cài-đặt)
- [Chạy dự án](#-chạy-dự-án)
- [CI/CD](#-cicd)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)

## 📖 Giới thiệu

Advanced Garage Management System (AGMS) là hệ thống quản lý garage ô tô toàn diện, bao gồm:

- ✅ Quản lý khách hàng và xe
- ✅ Quản lý lịch hẹn và dịch vụ
- ✅ Quản lý kho và sản phẩm
- ✅ Quản lý nhân viên và phân quyền
- ✅ Báo cáo và thống kê
- ✅ Hệ thống thanh toán

## 🛠️ Tech Stack

### Backend
- **Framework**: ASP.NET Core 8.0
- **Database**: Microsoft SQL Server 2022
- **ORM**: Entity Framework Core
- **API Doc**: Swagger/OpenAPI

### Frontend
- **Framework**: React 19.2
- **Build Tool**: Vite
- **Language**: TypeScript
- **Package Manager**: Yarn 4

### DevOps
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Registry**: GitHub Container Registry (GHCR)
- **Web Server**: Nginx

## 💻 Yêu cầu hệ thống

### Development:
- .NET SDK 8.0+
- Node.js 20+
- SQL Server 2019+ hoặc Docker
- Yarn 4+
- Git

### Production:
- Ubuntu Server 20.04+
- Docker 24.0+
- Docker Compose v2+
- 4GB RAM (tối thiểu)
- 20GB Disk Space

## 🚀 Cài đặt

### 1. Clone repository

```bash
git clone https://github.com/quangnhattt/SP26_G23_Capstone.git
cd SP26_G23_Capstone
```

### 2. Setup Backend

```bash
cd BE/src/AGMS

# Restore dependencies
dotnet restore

# Update database connection string trong appsettings.json
# Chỉnh sửa ConnectionStrings:MyCnn với thông tin database của bạn

# Run migrations (nếu có)
dotnet ef database update --project AGMS.WebApi

# Run project
dotnet run --project AGMS.WebApi
```

Backend sẽ chạy tại: `http://localhost:5000` hoặc `https://localhost:5001`
Swagger UI: `http://localhost:5000/swagger`

### 3. Setup Frontend

```bash
cd FE/web-advanced-garage-management-system

# Enable Corepack (nếu chưa enable)
corepack enable

# Install dependencies
yarn install

# Run development server
yarn dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

## 🐳 Chạy dự án với Docker

### Quick Start

```bash
# Tạo file .env
cp .env.example .env

# Update .env với thông tin của bạn
nano .env

# Build và start containers
docker-compose up -d

# Xem logs
docker-compose logs -f
```

### Truy cập ứng dụng:
- **Frontend**: http://localhost:80
- **Backend**: http://localhost:8080
- **Swagger**: http://localhost:8080/swagger
- **Database**: localhost:1433

### Các lệnh Docker hữu ích:

```bash
# Stop containers
docker-compose down

# Restart containers
docker-compose restart

# Xem logs của service cụ thể
docker-compose logs -f backend

# Rebuild images
docker-compose build --no-cache

# Clean up
docker-compose down -v
```

### Hoặc sử dụng Makefile:

```bash
make up        # Start containers
make down      # Stop containers
make logs      # Xem logs
make test      # Test local
make help      # Xem tất cả commands
```

## 🔄 CI/CD - Multi-Environment Deployment

### Deploy tự động với GitHub Actions

Dự án hỗ trợ deploy đồng thời nhiều môi trường:

| Branch | Environment | Ports | Database |
|--------|-------------|-------|----------|
| **master/main** | Production | Frontend: 3000, Backend: 9000 | CarServiceDBDoAN5 |
| **UAT** | Staging | Frontend: 3001, Backend: 9001 | CarServiceDBDoAN5_UAT |

**Lưu ý bảo mật:** Sử dụng ports không phổ biến để tránh bị scan/tấn công tự động.

### Workflow files:
- `.github/workflows/ci-cd.yml` - SSH-based deployment
- `.github/workflows/ci-cd-runner.yml` - Self-hosted runner (khuyến nghị cho nhiều repos)

### 📖 Hướng dẫn:

- **Setup CI/CD:** [CICD-SETUP.md](./CICD-SETUP.md)
- **Configuration:** [CONFIGURATION.md](./CONFIGURATION.md) - **Không cần .env file!**
- **Security:** [SECURITY-NOTES.md](./SECURITY-NOTES.md) 

**2 Options:**
- Option 1: SSH-based (đơn giản, cần SSH key)
- Option 2: Self-hosted Runner (không cần SSH key, dùng nhiều repos)

### Deployment:
```bash
# Deploy to UAT
git push origin UAT

# Deploy to Production
git push origin master
```

### Workflow tự động:

1. **Push code** lên branch `main`, `master`, hoặc `UAT`
2. **GitHub Actions** tự động:
   - ✅ Build và test code
   - ✅ Build Docker images
   - ✅ Push lên GitHub Container Registry
   - ✅ Deploy lên server Ubuntu

### Setup nhanh:

```bash
# 1. Setup server (xem DEPLOYMENT.md)
# 2. Thêm GitHub Secrets (xem README-CICD.md)
# 3. Push code

git add .
git commit -m "Deploy to UAT"
git push origin UAT
```

### Deploy thủ công:

```bash
# Set environment variables
export SERVER_HOST="your-server-ip"
export SERVER_USER="ubuntu"

# Run deploy script
bash scripts/deploy.sh production
```

## 📁 Cấu trúc dự án

```
SP26_G23_Capstone/
├── BE/                                 # Backend .NET
│   └── src/AGMS/
│       ├── AGMS.Application/          # Application layer
│       ├── AGMS.Domain/               # Domain entities
│       ├── AGMS.Infrastructure/       # Data access & services
│       ├── AGMS.WebApi/              # API endpoints
│       ├── Dockerfile                # Backend Docker config
│       └── .dockerignore
│
├── FE/                                # Frontend React
│   └── web-advanced-garage-management-system/
│       ├── src/                      # Source code
│       ├── public/                   # Static assets
│       ├── Dockerfile               # Frontend Docker config
│       ├── nginx.conf              # Nginx configuration
│       └── package.json
│
├── .github/
│   └── workflows/
│       ├── ci-cd.yml               # CI/CD pipeline chính
│       └── docker-build-test.yml   # Docker build tests
│
├── scripts/
│   ├── deploy.sh                   # Deploy script
│   ├── local-test.sh              # Local testing
│   └── health-check.sh            # Health check
│
├── docker-compose.yml              # Development config
├── docker-compose.prod.yml         # Production config
├── Makefile                        # Make commands
├── .env.example                    # Environment template
├── README.md                       # This file
├── README-CICD.md                  # CI/CD quick guide
└── DEPLOYMENT.md                   # Deployment guide
```

## 🧪 Testing

### Backend Tests:
```bash
cd BE/src/AGMS
dotnet test
```

### Frontend Tests:
```bash
cd FE/web-advanced-garage-management-system
yarn test
```

### Docker Tests:
```bash
bash scripts/local-test.sh
```

## 📊 API Documentation

Sau khi chạy backend, truy cập Swagger UI để xem API documentation:

- **Local**: http://localhost:5000/swagger
- **Docker**: http://localhost:8080/swagger
- **Production**: https://your-domain.com/swagger (nếu được enable)

## 🔒 Security

- ⚠️ **QUAN TRỌNG**: Đổi mật khẩu database mặc định trong `.env`
- ⚠️ Không commit file `.env` vào Git
- ⚠️ Sử dụng HTTPS trong production
- ⚠️ Thường xuyên update dependencies

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📝 License

Dự án này được phát triển cho mục đích học tập - SP26_G23_Capstone

## 👥 Team

- **Group**: G23
- **Course**: SP26
- **Project**: Capstone

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra [DEPLOYMENT.md](./DEPLOYMENT.md) và [README-CICD.md](./README-CICD.md)
2. Xem GitHub Issues
3. Liên hệ team để được hỗ trợ

---

**Made with ❤️ by Team G23**