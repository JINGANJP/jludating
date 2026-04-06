import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerModule } from '@nestjs/throttler'
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
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 10,
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
  providers: [AppService],
})
export class AppModule {}
