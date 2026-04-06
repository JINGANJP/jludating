# JLUDating Monorepo Scaffold

## Projects

- `jludating-web`: React + TypeScript + Vite + Tailwind front-end scaffold
- `jludating-api`: NestJS + Prisma + PostgreSQL + Redis back-end scaffold

## Local development

1. Start infrastructure:

```powershell
docker compose up -d
```

2. Run database migrations and seed:

```powershell
cd jludating-api
npm run prisma:migrate   # create tables (run once)
npm run db:seed          # seed email whitelist
npm run prisma:generate
```

3. Start the API:

```powershell
cd jludating-api
npm run start:dev
```

4. Start the web app in another terminal:

```powershell
cd jludating-web
npm run dev
```

## Status (as of 2026-04-04)

### Done ✅
- **Database**: PostgreSQL + Redis running in Docker, `prisma migrate` creates all tables
- **Auth**: Real JWT-based authentication with:
  - Email whitelist validation (`mails.jlu.edu.cn`, `jlu.edu.cn`)
  - 6-digit verification codes stored in Redis (10 min TTL)
  - bcrypt password hashing (cost factor 12)
  - Access token (15 min) + Refresh token (7 days, stored in Redis)
  - Automatic token refresh on 401
- **Users**: Profile data stored in PostgreSQL, history query via Prisma

### In progress / TODO
- JWT Guard on protected routes (me, history, questionnaire, match)
- Profile, Questionnaire, Matching modules with real business logic
- Admin module for managing matching rounds

## Tech stack

### Frontend
- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Query + Zustand
- React Router v6
- Lucide icons

### Backend
- NestJS 11 + Prisma 7 (PostgreSQL adapter)
- Redis (ioredis) for cache/sessions
- JWT (@nestjs/jwt) + bcrypt
- Nodemailer for email delivery
