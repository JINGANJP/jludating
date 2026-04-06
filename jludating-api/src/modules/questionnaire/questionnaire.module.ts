import { Module } from '@nestjs/common'
import { QuestionnaireController } from './questionnaire.controller'
import { QuestionnaireService } from './questionnaire.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [QuestionnaireController],
  providers: [QuestionnaireService],
})
export class QuestionnaireModule {}
