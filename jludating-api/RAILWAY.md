# JLUDating Railway 部署配置
# Railway 会自动检测并部署

# Railway 环境变量需要在 Railway 控制台设置
# 重要：以下值需要替换为真实值

# ============================================
# 必需的环境变量 (在 Railway 控制台设置)
# ============================================

# 数据库连接 (Railway PostgreSQL)
# DATABASE_URL=postgresql://xxx:xxx@xxx.rackspace.com:5432/jludating

# Redis 连接 (Railway Redis 或 Upstash)
# REDIS_URL=redis://xxx:6379

# JWT 密钥 (必须至少32字符)
# 使用: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# JWT_SECRET=your_32_char_minimum_secret_here

# 邮件服务 (保持不变)
# MAIL_HOST=smtp.163.com
# MAIL_PORT=465
# MAIL_USER=15922830971@163.com
# MAIL_PASS=your_163授权码
# MAIL_FROM=JLUDating <15922830971@163.com>

# 前端 URL (Vercel部署后填写)
# FRONTEND_URL=https://your-app.vercel.app

# 应用端口 (Railway 会自动设置 PORT 环境变量)
# APP_PORT=3000
