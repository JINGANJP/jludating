import { Module } from '@nestjs/common'
import { MatchingController } from './matching.controller'
import { MatchingService } from './matching.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [MatchingController],
  providers: [MatchingService],
})
export class MatchingModule {}
