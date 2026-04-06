# JLUDating 正式部署方案

> 目标：让所有人通过域名直接访问网站，24/7 在线

---

## 目录

1. [架构概览](#1-架构概览)
2. [推荐方案（国内服务器）](#2-推荐方案国内服务器)
3. [Step-by-Step 部署步骤](#3-step-by-step-部署步骤)
4. [域名与 HTTPS 配置](#4-域名与-https-配置)
5. [环境变量配置](#5-环境变量配置)
6. [维护与运维](#6-维护与运维)
7. [本地最后测试流程](#7-本地最后测试流程)

---

## 1. 架构概览

```
用户浏览器
    │
    ▼
[域名 DNS] → jludating.cn
    │
    ▼
[Nginx 反向代理] ← 443/HTTPS, SSL 证书
    ├── /        → 前端静态文件 (React build)
    └── /api/*   → NestJS 后端 (port 3000)
                        │
                ┌───────┼───────┐
                ▼       ▼       ▼
          PostgreSQL  Redis  163.com SMTP
```

---

## 2. 推荐方案（国内服务器）

### 方案 A：腾讯云/阿里云 ECS（推荐，面向国内用户最快）

| 配置项 | 推荐规格 | 月费用（参考） |
|--------|---------|--------------|
| 服务器 | 2 核 4G 内存，CentOS 7 / Ubuntu 22.04 | ~70-120元/月 |
| 带宽 | 5Mbps 按固定带宽 | 含在上面 |
| 域名 | .cn 或 .com（需实名认证） | ~50元/年 |
| SSL 证书 | 腾讯云免费 DV 证书（有效期1年，可续期）| 免费 |
| 数据库 | 自建 PostgreSQL on ECS 或云数据库 RDS | 自建免费 |

> ⚠️ **注意**：国内服务器需要 ICP 备案（约 20 个工作日），建议现在就提交备案申请。

### 方案 B：Vercel（前端）+ Railway/Render（后端）

适合快速验证，无需备案，但国内访问较慢：

| 组件 | 平台 | 费用 |
|------|------|------|
| 前端 React | Vercel (免费) | 免费 |
| 后端 NestJS | Railway 或 Render | 免费额度够用 |
| PostgreSQL | Railway 或 Supabase | 免费额度 |
| Redis | Upstash Redis | 免费额度 |

---

## 3. Step-by-Step 部署步骤

### 前置条件

```bash
# 服务器环境安装（Ubuntu 22.04）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # 应输出 v20.x

sudo apt-get install -y postgresql postgresql-contrib redis-server nginx git
```

### Step 1：上传代码

```bash
# 在服务器上 clone 项目（推荐用 GitHub 私有仓库）
git clone https://github.com/your-username/jludating.git /var/www/jludating
cd /var/www/jludating
```

### Step 2：配置后端环境变量

```bash
cd jludating-api
cp .env.example .env
nano .env
```

`.env` 内容（见第 5 节完整说明）

### Step 3：安装依赖 + 构建

```bash
# 后端
cd /var/www/jludating/jludating-api
npm install --production
npx prisma generate
npx prisma migrate deploy  # 生产环境用 migrate deploy，不用 dev
node -e "require('./dist/src/main')"  # 快速验证

# 前端构建
cd /var/www/jludating/jludating-web
npm install
npm run build
# 产出在 dist/ 目录
```

### Step 4：使用 PM2 管理后端进程

```bash
# 安装 PM2
sudo npm install -g pm2

# 启动后端
cd /var/www/jludating/jludating-api
pm2 start dist/src/main.js --name jludating-api --env production

# 开机自启
pm2 startup
pm2 save

# 常用命令
pm2 logs jludating-api   # 查看日志
pm2 restart jludating-api
pm2 status
```

### Step 5：Nginx 配置

```bash
sudo nano /etc/nginx/sites-available/jludating
```

**Nginx 配置文件内容：**

```nginx
server {
    listen 80;
    server_name jludating.cn www.jludating.cn;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name jludating.cn www.jludating.cn;

    # SSL 证书路径（腾讯云下载后上传到服务器）
    ssl_certificate     /etc/ssl/jludating/fullchain.pem;
    ssl_certificate_key /etc/ssl/jludating/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    # 前端静态文件
    root /var/www/jludating/jludating-web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;  # React Router 需要这行
    }

    # 后端 API 反向代理
    location /api/ {
        proxy_pass         http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/jludating /etc/nginx/sites-enabled/
sudo nginx -t   # 验证配置
sudo systemctl reload nginx
```

### Step 6：PostgreSQL 初始化

```bash
sudo -u postgres psql
CREATE DATABASE jludating;
CREATE USER jludating_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE jludating TO jludating_user;
\q
```

### Step 7：运行数据库迁移 + 种子

```bash
cd /var/www/jludating/jludating-api
npx prisma migrate deploy
npx ts-node prisma/seed.ts  # 写入吉大邮箱白名单

# 创建第一期匹配轮次（需要先用管理员账号登录，或直接 SQL）
# 或通过 /api/admin/rounds/create 接口创建
```

---

## 4. 域名与 HTTPS 配置

### 域名购买

1. 在 [腾讯云域名注册](https://dnspod.cloud.tencent.com/) 或阿里云万网购买
2. 推荐：`jludating.cn` 或 `jludating.love`（有趣）
3. 需要实名认证（手持身份证照片）

### DNS 解析（腾讯云 DNSPod）

| 类型 | 主机记录 | 记录值 |
|------|---------|-------|
| A | @ | 你的服务器公网 IP |
| A | www | 你的服务器公网 IP |

### SSL 证书（腾讯云免费证书）

1. 登录腾讯云 → SSL 证书 → 申请免费证书
2. 选择「免费版（DV）」，填写域名 `jludating.cn`
3. DNS 验证（在 DNSPod 添加 CNAME 记录，系统自动验证）
4. 下载证书 → Nginx 格式 → 上传到服务器

```bash
sudo mkdir /etc/ssl/jludating
# 上传 fullchain.pem 和 privkey.pem 到 /etc/ssl/jludating/
```

---

## 5. 环境变量配置

生产环境 `.env` 文件（放在 `jludating-api/` 下）：

```env
# 数据库
DATABASE_URL=postgresql://jludating_user:your_strong_password@localhost:5432/jludating

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# JWT
JWT_SECRET=your_very_long_random_secret_here_min_32_chars  # 用 openssl rand -base64 32 生成
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# 邮件服务（保持不变）
MAIL_HOST=smtp.163.com
MAIL_PORT=465
MAIL_USER=15922830971@163.com
MAIL_PASS=MDk74udH9Nu4vTyF
MAIL_FROM="JLUDating <15922830971@163.com>"

# 服务器配置
APP_PORT=3000
FRONTEND_URL=https://jludating.cn,https://www.jludating.cn
NODE_ENV=production
```

> ⚠️ **安全提醒**：生产环境请务必更换 JWT_SECRET，用 `openssl rand -base64 32` 生成随机值

---

## 6. 维护与运维

### 更新代码

```bash
cd /var/www/jludating
git pull origin main

# 后端更新
cd jludating-api
npm install
npm run build
npx prisma migrate deploy
pm2 restart jludating-api

# 前端更新
cd ../jludating-web
npm install
npm run build
# Nginx 自动读取新的 dist/ 文件，无需重启
```

### 监控

```bash
pm2 monit          # 实时监控
pm2 logs --lines 100   # 最近 100 行日志
```

### 数据库备份

```bash
# 每天凌晨2点自动备份
crontab -e
# 添加：
0 2 * * * pg_dump -U jludating_user jludating > /backup/db-$(date +%Y%m%d).sql
```

---

## 7. 本地最后测试流程

在部署前，本地需要启动 Docker 完成最终测试：

```bash
# 1. 启动 Docker Desktop（Windows）

# 2. 启动数据库和 Redis
docker compose up -d

# 3. 启动后端
cd jludating-api
npm run start:dev

# 4. 启动前端（另开终端）
cd jludating-web
npm run dev

# 5. 访问 http://localhost:5173 测试以下流程：
#    ✅ 注册：发送验证码 → 填写密码 → 注册成功
#    ✅ 登录：邮箱+密码 → 跳转首页
#    ✅ 填写资料：完成度达到 60%
#    ✅ 填写问卷：完成度达到 80%
#    ✅ 报名匹配：创建期次 → 报名 → 成功
#    ✅ 未登录访问 /profile → 自动跳转登录页
#    ✅ 未授权访问 /api/admin/dashboard → 返回 401
```

---

## 快速上线检查清单

- [ ] Docker Desktop 启动
- [ ] `docker compose up -d` 成功
- [ ] 本地测试所有核心流程通过
- [ ] `.env` 生产配置已准备（特别是 JWT_SECRET 和 FRONTEND_URL）
- [ ] 服务器已购买（推荐腾讯云 CentOS/Ubuntu）
- [ ] 域名已购买并实名认证
- [ ] ICP 备案已提交（或使用境外服务器跳过）
- [ ] SSL 证书已申请
- [ ] Nginx 配置已测试 (`nginx -t` 通过)
- [ ] PM2 已配置开机自启
- [ ] 数据库迁移已运行
- [ ] 种子数据已写入（邮箱白名单）
- [ ] 第一期匹配轮次已创建

---

*文档生成时间：2026-04-06*
