import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { MatchingService } from './matching.service'
import type { CurrentUserPayload } from '../auth/guards/authenticated.guard'
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard'
import { CurrentUser } from '../auth/current-user.decorator'

@Controller('matching')
@UseGuards(AuthenticatedGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('current-round')
  getCurrentRound() {
    return this.matchingService.getCurrentRound()
  }

  @Post('join')
  join(@CurrentUser() user: CurrentUserPayload) {
    return this.matchingService.join(user.userId)
  }

  @Get('result')
  getResult(@CurrentUser() user: CurrentUserPayload) {
    return this.matchingService.getResult(user.userId)
  }

  @Post('accept')
  accept(@CurrentUser() user: CurrentUserPayload) {
    return this.matchingService.accept(user.userId)
  }

  @Post('decline')
  decline(@CurrentUser() user: CurrentUserPayload) {
    return this.matchingService.decline(user.userId)
  }

  /** 按相似度推荐候选人列表（用户可浏览参考） */
  @Get('recommendations')
  getRecommendations(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: string,
  ) {
    return this.matchingService.getRecommendations(user.userId, limit ? parseInt(limit) : 10)
  }

  /** 手动触发一轮匹配（管理员接口） */
  @Post('run')
  runMatching() {
    return this.matchingService.runMatching()
  }
}
