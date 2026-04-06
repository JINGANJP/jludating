# JLUDating 项目进展日志

## 2026-04-04

### 完成的重大更新：真实注册登录鉴权

**后端 (jludating-api/src/modules/auth/)**：
- `auth.service.ts` 完全重写：
  - `sendCode`: 白名单校验 + Redis 存储验证码 (10min TTL) + nodemailer 发送
  - `verifyCode`: Redis 校验，一次性消耗
  - `register`: 验证码二次校验 + bcrypt 密码哈希 + Prisma 创建 User + Profile + JWT 签发 + Redis 存 refresh token
  - `login`: Prisma 查用户 + bcrypt 验证 + JWT 签发 + Redis 存 refresh token
  - `refresh`: JWT 校验 + Redis 验证 refresh token + 重签发
  - `logout`: Redis 删除 refresh token
- `auth.controller.ts`: 补充 refresh/logout 参数
- `auth.module.ts`: 导入 JwtModule + PassportModule

**后端 Users 模块**：
- `users.service.ts`: Prisma 真实查询 (getMe, getHistory)
- `users.controller.ts`: 注入 PrismaService

**数据库**：
- `prisma migrate dev`: 创建所有 7 张表
- `prisma/seed.ts`: 种子吉林大学邮箱白名单 (mails.jlu.edu.cn, jlu.edu.cn)
- `package.json`: 添加 `"db:seed": "ts-node prisma/seed.ts"` 和 `"prisma.seed"` 配置

**前端 (jludating-web/src/)**：
- `types/auth.ts`: 更新 AuthSession 类型 (id, status)
- `api/auth.ts`: 重写
  - axios 请求拦截器自动附加 Bearer token
  - 响应拦截器 401 时自动 refresh token
  - localStorage 持久化 access/refresh token
  - logout 调用后端 + 清除本地 token
- `stores/use-auth-store.ts`: zustand/persist 持久化 session
- `pages/login.tsx`: 登录成功后 navigate('/')
- `pages/register.tsx`: 重构为两步流程 (邮箱验证码 → 设置密码)
- `components/layout/app-shell.tsx`: 根据登录状态显示不同导航 + 登出按钮

### 当前运行状态
- 后端: http://localhost:3000 ✅
- 前端: http://localhost:5173 ✅
- 测试账号: test@mails.jlu.edu.cn / TestPass123

### 邮件服务配置（重要）
- 发件服务: 15922830971@163.com (授权码 MDk74udH9Nu4vTyF)
- SMTP 端口: **465 (SSL)**，587 STARTTLS 在此网络下不通
- 白名单已添加: mails.jlu.edu.cn, jlu.edu.cn, 163.com
- MailService 在 `src/mail/mail.service.ts`，检测端口自动切换 SSL/STARTTLS
- **已验证：163.com 邮箱实收验证码 ✅**

### JWT Guard 实现
- `src/modules/auth/guards/authenticated.guard.ts`: 自研 CanActivate Guard，用 jsonwebtoken 直接验 JWT，不依赖 Passport
- `src/modules/auth/current-user.decorator.ts`: 从 request.user 取当前用户
- 保护路由: /users/me, /users/history, /users/profile, /users/questionnaire, /matching/*
- 前端路由守卫: `src/router/index.tsx` loader 通过 requireAuth() 抛 redirect
- AuthenticatedGuard 导出自 AuthModule，各模块导入 AuthModule 即可使用

### 下一步
- JWT Guard 保护 /users/me, /users/history, /questionnaire, /match 等路由
- Profile, Questionnaire, Matching 模块的真实业务逻辑实现
