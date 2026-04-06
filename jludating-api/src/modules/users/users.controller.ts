import { Controller, Get, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import type { CurrentUserPayload } from '../auth/guards/authenticated.guard'
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard'
import { CurrentUser } from '../auth/current-user.decorator'

@Controller('users')
@UseGuards(AuthenticatedGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.getMe(user.userId)
  }

  @Get('history')
  getHistory(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.getHistory(user.userId)
  }
}
