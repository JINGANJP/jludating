import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { validateEnv } from './config/env.validation'
import { MailModule } from './mail/mail.module'
import { AdminModule } from './modules/admin/admin.module'
import { AuthModule } from './modules/auth/auth.module'
import { MatchingModule } from './modules/matching/matching.module'
import { ProfileModule } from './modules/profile/profile.module'
import { QuestionnaireModule } from './modules/questionnaire/questionnaire.module'
import { UsersModule } from './modules/users/users.module'
import { PrismaModule } from './prisma/prisma.module'
import { RedisModule } from './redis/redis.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    // 全局限流：普通接口 60秒内最多100次
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
        name: 'default',
      },
      // 登录注册接口更严格：60秒最多5次
      {
        ttl: 60_000,
        limit: 5,
        name: 'auth',
      },
      // 验证码发送：更严格
      {
        ttl: 60_000,
        limit: 3,
        name: 'send-code',
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    MailModule,
    AuthModule,
    UsersModule,
    ProfileModule,
    QuestionnaireModule,
    MatchingModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 全局应用限流Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
