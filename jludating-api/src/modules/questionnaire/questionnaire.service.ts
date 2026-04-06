import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { Prisma } from '@prisma/client'

@Injectable()
export class QuestionnaireService {
  constructor(private readonly prisma: PrismaService) {}

  async getDraft(userId: string) {
    const q = await this.prisma.questionnaire.findUnique({
      where: { userId },
    })
    if (!q) {
      return { answers: {}, updatedAt: null }
    }
    return {
      answers: q.answers as Record<string, unknown>,
      updatedAt: q.updatedAt,
    }
  }

  async saveDraft(userId: string, payload: Record<string, unknown>) {
    const answers = (payload.answers ?? {}) as Prisma.InputJsonValue
    const q = await this.prisma.questionnaire.upsert({
      where: { userId },
      update: { answers },
      create: { userId, answers },
    })
    return { success: true, updatedAt: q.updatedAt }
  }
}
