import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common'
import { QuestionnaireService } from './questionnaire.service'
import type { CurrentUserPayload } from '../auth/guards/authenticated.guard'
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard'
import { CurrentUser } from '../auth/current-user.decorator'

@Controller('users/questionnaire')
@UseGuards(AuthenticatedGuard)
export class QuestionnaireController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}

  @Get()
  getDraft(@CurrentUser() user: CurrentUserPayload) {
    return this.questionnaireService.getDraft(user.userId)
  }

  @Put()
  saveDraft(
    @CurrentUser() user: CurrentUserPayload,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.questionnaireService.saveDraft(user.userId, payload)
  }
}
