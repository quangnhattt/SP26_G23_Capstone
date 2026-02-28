# 🚀 CI/CD Setup Guide

## 📋 Tổng quan

Dự án có 2 workflows GitHub Actions:
- **ci-cd.yml**: SSH-based deployment (đơn giản, dùng SSH key) ✅ **Smart build enabled**
- **ci-cd-runner.yml**: Self-hosted runner (khuyến nghị cho nhiều repos)

### 🧠 Smart Build Detection

Workflow tự động detect thay đổi và **chỉ build những gì cần**:
- Chỉ sửa BE → Chỉ build BE (tiết kiệm ~50%)
- Chỉ sửa FE → Chỉ build FE (tiết kiệm ~50%)
- Sửa docs → Skip build (tiết kiệm ~95%)

Xem chi tiết: [SMART-BUILD.md](./SMART-BUILD.md)

**⚠️ QUAN TRỌNG:** Dự án **KHÔNG CẦN file .env**! Backend sử dụng connection string từ `appsettings.json` có sẵn trong code. Xem chi tiết: [CONFIGURATION.md](./CONFIGURATION.md)

## 🌐 Multi-Environment

| Branch | Environment | Frontend Port | Backend Port |
|--------|-------------|---------------|--------------|
| master/main | Production | 3000 | 9000 |
| UAT | Staging | 3001 | 9001 |

**Lưu ý:** Sử dụng ports không phổ biến để tăng bảo mật, tránh các ports thường bị scan (80, 8080, 8081, 8082, etc.)

---

## Option 1: SSH-based Deployment

### Setup trên Server

```bash
# 1. Cài Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# 2. Cài Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Tạo thư mục deploy
sudo mkdir -p /opt/agms
sudo chown -R $USER:$USER /opt/agms
cd /opt/agms

# 4. Cấu hình Database Connection (Optional)
# Backend sử dụng connection string từ appsettings.json
# Nếu cần override, edit file docker-compose.prod.yml hoặc docker-compose.uat.yml
# Uncomment và thay đổi dòng ConnectionStrings__MyCnn

# 5. Tạo SSH key cho GitHub Actions
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions -N ""
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 6. Copy private key (dùng cho GitHub Secret)
cat ~/.ssh/github-actions

# 7. Upload docker-compose files
# Scp từ local hoặc chúng sẽ tự động copy khi deploy
```

### Setup trên GitHub

1. Vào: https://github.com/quangnhattt/SP26_G23_Capstone/settings/actions
   - Enable Actions
   - Chọn "Read and write permissions"

2. Vào: https://github.com/quangnhattt/SP26_G23_Capstone/settings/secrets/actions
   
   Thêm secrets:
   ```
   SERVER_HOST = IP server (vd: 192.168.1.100)
   SERVER_USER = ubuntu (hoặc username SSH)
   SSH_PRIVATE_KEY = Private key từ bước 5
   DEPLOY_PATH = /opt/agms
   ```

3. Push code:
   ```bash
   git push origin UAT
   # hoặc
   git push origin master
   ```

---

## Option 2: Self-Hosted Runner (Khuyến nghị)

### Ưu điểm:
- ✅ Không cần SSH key
- ✅ 1 runner dùng cho nhiều repos
- ✅ An toàn hơn
- ✅ Deploy nhanh hơn

### Setup trên Server

```bash
# 1-3: Giống SSH-based (Docker, thư mục)
# Không cần tạo .env file!

# 4. Cài runner
mkdir ~/actions-runner && cd ~/actions-runner
curl -o actions-runner-linux.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux.tar.gz

# 6. Lấy token từ GitHub
# Vào: https://github.com/quangnhattt/SP26_G23_Capstone/settings/actions/runners/new
# Copy token

# 7. Configure runner
./config.sh --url https://github.com/quangnhattt/SP26_G23_Capstone --token YOUR_TOKEN

# Khi hỏi:
# - Runner name: ubuntu-runner-01
# - Work folder: _work

# 8. Install service
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status

# 9. Enable auto-start
sudo systemctl enable actions.runner.quangnhattt-SP26_G23_Capstone.ubuntu-runner-01.service
```

### Setup trên GitHub

1. Enable Actions (giống SSH-based)
2. **KHÔNG CẦN** thêm SSH secrets!
3. Đổi workflow file:
   ```bash
   # Rename hoặc disable ci-cd.yml
   # Enable ci-cd-runner.yml
   ```
4. Push code:
   ```bash
   git push origin UAT
   ```

### Verify runner online

Vào: https://github.com/quangnhattt/SP26_G23_Capstone/settings/actions/runners

Thấy runner với status "Idle" (màu xanh) → OK!

---

## 🔧 Quản lý Environments

### Xem containers đang chạy:
```bash
docker ps --filter name=agms
```

### Quản lý Production:
```bash
cd /opt/agms

# Logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart
docker-compose -f docker-compose.prod.yml restart

# Stop
docker-compose -f docker-compose.prod.yml down

# Start
docker-compose -f docker-compose.prod.yml up -d
```

### Quản lý UAT:
```bash
cd /opt/agms

# Logs
docker-compose -f docker-compose.uat.yml logs -f

# Restart
docker-compose -f docker-compose.uat.yml restart

# Stop/Start tương tự
```

---

## 🌐 Access URLs

### Production:
- Frontend: http://YOUR_SERVER_IP:3000
- Backend: http://YOUR_SERVER_IP:9000
- Swagger: http://YOUR_SERVER_IP:9000/swagger

### UAT:
- Frontend: http://YOUR_SERVER_IP:3001
- Backend: http://YOUR_SERVER_IP:9001
- Swagger: http://YOUR_SERVER_IP:9001/swagger

**Khuyến nghị:** Setup nginx reverse proxy với domain và SSL để không expose ports trực tiếp

---

## 🐛 Troubleshooting

### GitHub Actions fails?
```bash
# Xem logs tại:
https://github.com/quangnhattt/SP26_G23_Capstone/actions

# Kiểm tra trên server:
docker ps
docker logs agms-backend-prod
docker logs agms-backend-uat
```

### SSH connection error?
```bash
# Test SSH
ssh -i ~/.ssh/github-actions ubuntu@YOUR_SERVER_IP

# Check authorized_keys
cat ~/.ssh/authorized_keys
```

### Runner offline?
```bash
cd ~/actions-runner
sudo ./svc.sh status
sudo ./svc.sh restart
```

### Backend không connect SQL?
```bash
# Backend sử dụng connection string từ appsettings.json
# Check container logs
docker logs agms-backend-prod

# Test SQL connection
telnet localhost 1433

# Nếu cần override connection string, edit docker-compose.prod.yml
```

### Port conflicts?
```bash
# Check ports
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :9000

# Stop conflicting containers
docker stop <container_id>
```

---

## 📦 Firewall Setup

```bash
sudo ufw enable
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 3000/tcp    # Production Frontend
sudo ufw allow 9000/tcp    # Production Backend
sudo ufw allow 3001/tcp    # UAT Frontend
sudo ufw allow 9001/tcp    # UAT Backend
sudo ufw status
```

**Lưu ý bảo mật:**
- Không mở port 80, 8080, 8081, 8082 (các port phổ biến thường bị scan)
- Có thể thêm rate limiting với `ufw limit` thay vì `allow`
- Cân nhắc thêm fail2ban để chống brute force

---

## 🔄 Workflow

```
Developer push code → UAT branch
    ↓
GitHub Actions build & deploy
    ↓
Containers: agms-backend-uat (9001), agms-frontend-uat (3001)
    ↓
Test on http://server:3001
    ↓
If OK → Merge to master
    ↓
GitHub Actions build & deploy
    ↓
Containers: agms-backend-prod (9000), agms-frontend-prod (3000)
    ↓
Live on http://server:3000
```

---

## 📚 Files Structure

```
.github/workflows/
  ├── ci-cd.yml              # SSH-based
  └── ci-cd-runner.yml       # Self-hosted runner

docker-compose.prod.yml      # Production (port 3000, 9000)
docker-compose.uat.yml       # UAT (port 3001, 9001)
.env.example                 # Template

BE/src/AGMS/
  ├── Dockerfile
  └── .dockerignore

FE/web-advanced-garage-management-system/
  ├── Dockerfile
  ├── nginx.conf
  └── .dockerignore
```

---

**Chọn 1 trong 2 options và setup thôi! 🚀**
