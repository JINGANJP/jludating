# JLUDating 免费部署指南 (Vercel + Railway)

> 本指南将帮助你使用 **免费平台** 将 JLUDating 网站部署上线

---

## 📋 部署架构

```
用户浏览器
    │
    ▼
Vercel (前端)          Railway (后端)
jludating.vercel.app  jludating-api.up.railway.app
    │                        │
    └────────────────────────┘
              │
              ▼
        Supabase (PostgreSQL) / Neon
              │
              ▼
        Upstash (Redis)
```

---

## 🚀 第一步：准备数据库和Redis

### 1.1 PostgreSQL - 使用 Supabase (免费)

1. 访问 [supabase.com](https://supabase.com) 注册账号
2. 创建新项目
3. 等待数据库创建完成，获取连接信息：
   ```
   postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   ```

### 1.2 Redis - 使用 Upstash (免费)

1. 访问 [upstash.com](https://upstash.com) 注册账号
2. 创建新的 Redis 数据库
3. 获取连接信息：
   ```
   rediss://default:[PASSWORD]@[HOST]:6379
   ```

---

## 🚀 第二步：部署后端到 Railway

### 2.1 创建 Railway 账号

1. 访问 [railway.app](https://railway.app) 使用 GitHub 登录
2. 点击 "New Project" → "Deploy from GitHub repo"

### 2.2 配置 Railway 项目

1. 连接你的 GitHub 仓库 (`jludating-api`)
2. Railway 会自动检测为 Node.js 项目
3. 在 Settings 中添加环境变量：

```
DATABASE_URL = postgresql://xxx:xxx@xxx.supabase.co:5432/postgres
REDIS_URL = rediss://default:xxx@xxx.upstash.io:6379
JWT_SECRET = your_32_char_minimum_secret_here
JWT_EXPIRES_IN = 15m
FRONTEND_URL = https://your-app.vercel.app
MAIL_HOST = smtp.163.com
MAIL_PORT = 465
MAIL_USER = 15922830971@163.com
MAIL_PASS = your_163_authorization_code
MAIL_FROM = JLUDating <15922830971@163.com>
APP_PORT = 3000
NODE_ENV = production
```

4. 点击 Deploy 等待构建完成

### 2.3 生成 JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2.4 运行数据库迁移

Railway 会自动运行 `npm run prisma migrate deploy`

---

## 🚀 第三步：部署前端到 Vercel

### 3.1 创建 Vercel 账号

1. 访问 [vercel.com](https://vercel.com) 使用 GitHub 登录
2. 点击 "Add New..." → "Project"
3. 导入 `jludating-web` 仓库

### 3.2 配置 Vercel 项目

1. Framework Preset: Vite
2. Root Directory: `./jludating-web`
3. Build Command: `npm run build`
4. Output Directory: `dist`

### 3.3 添加环境变量

在 Vercel Settings → Environment Variables:

```
VITE_API_URL = https://your-railway-app.up.railway.app/api
```

> 注意：Railway 分配的域名格式是 `https://jludating-api.up.railway.app`

### 3.4 部署

点击 Deploy，等待构建完成

---

## 🔗 第四步：配置跨域

### 4.1 更新后端 FRONTEND_URL

在 Railway 环境变量中更新:

```
FRONTEND_URL = https://your-app.vercel.app,http://localhost:5173
```

### 4.2 重新部署

修改环境变量后，Railway 会自动重新部署

---

## 🧪 第五步：测试

部署完成后，访问你的 Vercel 域名进行测试：

1. ✅ 注册流程：发送验证码 → 填写密码 → 注册成功
2. ✅ 登录流程：邮箱+密码 → 跳转首页
3. ✅ 填写资料：完成度计算
4. ✅ 填写问卷：题目展示和提交
5. ✅ 报名匹配：加入匹配队列

---

## ⚠️ 重要安全提醒

### 1. 更换敏感信息

部署前请务必更换以下内容：

```bash
# 1. 生成新的 JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 2. 建议更换 163 邮箱授权码
# 登录 163 邮箱 → 设置 → POP3/SMTP/IMAP → 获取授权码
```

### 2. 禁止提交的文件

确保以下文件 **不在 Git 仓库中**：

```
jludating-api/.env
jludating-web/.env
```

---

## 💰 费用说明

| 服务 | 套餐 | 费用 |
|------|------|------|
| Supabase PostgreSQL | Starter | 免费 (500MB) |
| Upstash Redis | Pay as you go | 免费 (10K 命令/天) |
| Railway | Starter | 免费 ($5 额度/月) |
| Vercel | Hobby | 免费 (100GB 带宽/月) |

**总计：完全免费！** 🎉

---

## 🔧 维护和更新

### 更新代码

```bash
# 1. 本地修改代码
git add .
git commit -m "Your changes"
git push origin main

# 2. Railway 和 Vercel 会自动检测并重新部署
```

### 查看日志

- **Railway**: 在 Railway Dashboard → Project → Deployments → Logs
- **Vercel**: 在 Vercel Dashboard → Project → Deployments → Logs

---

## ❓ 常见问题

### Q: Railway 部署失败怎么办？

检查 Railway 日志，常见问题：
- 环境变量未设置
- 数据库连接失败
- 依赖安装失败

### Q: 前端 API 请求失败？

1. 确认 VITE_API_URL 环境变量设置正确
2. 确认 Railway 后端正常运行
3. 检查浏览器控制台错误信息

### Q: 邮箱验证码收不到？

1. 检查 MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS 配置
2. 163 邮箱需要开启 IMAP/SMTP 服务
3. 检查垃圾邮件文件夹

---

*文档生成时间：2026-04-06*
