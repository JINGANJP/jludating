import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common'
import { ProfileService } from './profile.service'
import type { CurrentUserPayload } from '../auth/guards/authenticated.guard'
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard'
import { CurrentUser } from '../auth/current-user.decorator'

@Controller('users/profile')
@UseGuards(AuthenticatedGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.profileService.getProfile(user.userId)
  }

  @Put()
  updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.profileService.updateProfile(user.userId, payload)
  }
}
