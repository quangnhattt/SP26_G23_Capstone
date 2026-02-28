# ⚙️ Configuration Guide

## 🎯 Không cần file .env!

Dự án này **KHÔNG YÊU CẦU file .env** vì:
- ✅ Backend sử dụng `appsettings.json` (đã có sẵn trong code)
- ✅ Frontend được build sẵn với config
- ✅ Tránh động vào code có sẵn

---

## 🔧 Backend Configuration

### Mặc định (Khuyến nghị - Không động code)

Backend sẽ tự động sử dụng connection string từ `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "MyCnn": "Server=DESKTOP-PLQLG4L\\SQLEXPRESS;Database=CarServiceDBDoAN5;..."
  }
}
```

**Ưu điểm:**
- ✅ Không cần tạo .env file
- ✅ Không cần config gì thêm trên server
- ✅ Connection string đã có sẵn trong code

**Deploy ngay:**
```bash
git push origin UAT
# hoặc
git push origin master
```

### Override (Nếu cần thay đổi connection string)

Nếu SQL Server trên server khác với code, edit `docker-compose.prod.yml`:

```yaml
environment:
  - ASPNETCORE_ENVIRONMENT=Production
  # Uncomment và sửa dòng dưới:
  - ConnectionStrings__MyCnn=Server=YOUR_SERVER;Database=CarServiceDBDoAN5;User Id=sa;Password=YOUR_PASS;Encrypt=True;TrustServerCertificate=True;MultipleActiveResultSets=True
```

---

## 🌐 Frontend Configuration

Frontend được build với config từ `.env.production` và nhúng vào build:

```
VITE_API_BASE_URL=http://localhost:9000
```

**Để thay đổi Backend URL:**

1. Sửa `FE/web-advanced-garage-management-system/.env.production`
2. Push code → GitHub Actions sẽ build lại với config mới

---

## 📊 3 Cách Cấu hình (Chọn 1)

### ✅ Cách 1: Dùng code mặc định (Khuyến nghị)

**Không làm gì cả!** Backend dùng appsettings.json

```bash
# Setup server chỉ cần Docker
curl -fsSL https://get.docker.com | sudo sh

# Deploy
git push origin UAT
```

### 🔧 Cách 2: Override trong docker-compose

Edit `docker-compose.prod.yml` trên server sau khi deploy lần đầu:

```bash
cd /opt/agms
nano docker-compose.prod.yml

# Uncomment và sửa dòng ConnectionStrings__MyCnn
# Restart containers
docker-compose -f docker-compose.prod.yml restart
```

### 🔐 Cách 3: Dùng GitHub Secrets (Advanced)

Pass connection string từ GitHub Secrets trong workflow:

1. Add GitHub Secret: `DB_CONNECTION_STRING`
2. Update workflow để inject vào docker-compose

---

## 🎯 So sánh các cách

| Cách | Ưu điểm | Nhược điểm | Phù hợp |
|------|---------|------------|---------|
| **1. Default (appsettings.json)** | Đơn giản nhất, không config | DB phải giống code | Dev/Test |
| **2. Docker-compose override** | Dễ thay đổi, không động code | Phải edit file trên server | Production |
| **3. GitHub Secrets** | An toàn nhất, tập trung | Phức tạp hơn | Enterprise |

---

## 📝 Configuration Files

### Backend:
```
BE/src/AGMS/AGMS.WebApi/
  ├── appsettings.json              # Development (default)
  ├── appsettings.Production.json   # Production overrides
  └── appsettings.Staging.json      # UAT overrides (optional)
```

### Frontend:
```
FE/web-advanced-garage-management-system/
  ├── .env.production               # Production build config
  └── .env.development              # Dev config (optional)
```

### Docker:
```
docker-compose.prod.yml              # Production deployment
docker-compose.uat.yml               # UAT deployment
docker-compose.yml                   # Local development
```

---

## 🔍 Environment Variables Priority

Backend (.NET) resolution order:
```
1. Docker environment variables (docker-compose.yml)
   ↓ (nếu không có)
2. appsettings.{Environment}.json
   ↓ (nếu không có)
3. appsettings.json
```

Frontend (Vite) resolution:
```
1. Build-time from .env.production
2. Hardcoded in code
```

---

## 🚀 Quick Start Without .env

### Chuẩn bị:
```bash
# Không cần làm gì về config!
# Chỉ cần:
1. Server có Docker
2. SQL Server running (với DB như trong code)
3. GitHub Actions setup
```

### Deploy:
```bash
git push origin UAT
# Done! Backend tự động dùng connection string từ appsettings.json
```

### Verify:
```bash
# Check backend logs
docker logs agms-backend-prod

# Nếu thấy "Connected to database" → OK!
```

---

## 🔧 Troubleshooting

### Backend không connect database?

**Kiểm tra:**
```bash
# 1. Check logs
docker logs agms-backend-prod

# 2. Xem connection string đang dùng
docker exec -it agms-backend-prod printenv | grep ConnectionStrings

# 3. Test SQL từ container
docker exec -it agms-backend-prod bash
# Trong container:
apt-get update && apt-get install -y telnet
telnet YOUR_SQL_SERVER 1433
```

**Giải pháp:**

Nếu SQL Server khác với code:
1. Edit `docker-compose.prod.yml`
2. Uncomment dòng `ConnectionStrings__MyCnn`
3. Thay đổi server/password
4. Restart: `docker-compose -f docker-compose.prod.yml restart`

---

## 🎓 Best Practices

### Development:
- ✅ Dùng appsettings.json (default)
- ✅ LocalDB hoặc Docker SQL Server
- ✅ Git không commit passwords

### Production:
- ✅ Override connection string trong docker-compose
- ✅ Hoặc dùng Azure Key Vault / AWS Secrets Manager
- ✅ Environment-specific configs
- ✅ Backup connection strings

---

## 📚 Related Files

- [CICD-SETUP.md](./CICD-SETUP.md) - CI/CD setup (không cần .env!)
- [SECURITY-NOTES.md](./SECURITY-NOTES.md) - Security best practices
- [README.md](./README.md) - Project overview

---

**TL;DR: Không cần .env file! Backend dùng appsettings.json có sẵn trong code.** ✨
