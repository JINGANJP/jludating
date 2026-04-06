import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import {
  calculateCompatibilityScore,
  greedyStableMatch,
  rankCandidates,
  DIMENSION_WEIGHTS,
} from './matching-engine'

const REQUIRED_PROFILE_COMPLETION = 60
const QUESTIONNAIRE_TOTAL_QUESTIONS = 52  // 问卷共 9 个维度 52 题

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentRound() {
    const round = await this.prisma.matchingRound.findFirst({
      where: { status: 'OPEN' },
      orderBy: { roundNumber: 'desc' },
    })
    if (!round) {
      return { roundNumber: 0, status: 'closed', participantCount: 0, startsAt: null, endsAt: null }
    }
    return {
      roundNumber: round.roundNumber,
      status: round.status.toLowerCase(),
      participantCount: round.participantCount,
      startsAt: round.startDate.toISOString(),
      endsAt: round.endDate.toISOString(),
    }
  }

  async join(userId: string) {
    // 1. 检查当前轮次是否开放
    const round = await this.prisma.matchingRound.findFirst({
      where: { status: 'OPEN' },
      orderBy: { roundNumber: 'desc' },
    })
    if (!round) {
      return { success: false, message: '当前没有开放的匹配轮次' }
    }
    if (round.status !== 'OPEN') {
      return { success: false, message: '本期报名已结束' }
    }

    // 2. 检查是否已报名
    const existing = await this.prisma.roundParticipant.findUnique({
      where: { roundId_userId: { roundId: round.id, userId } },
    })
    if (existing && !existing.cancelledAt) {
      return { success: false, message: '你已成功报名本期匹配，无需重复报名' }
    }

    // 3. 检查资料完成度
    const profile = await this.prisma.profile.findUnique({ where: { userId } })
    const profileCompletion = profile?.profileCompletion ?? 0
    if (profileCompletion < REQUIRED_PROFILE_COMPLETION) {
      return {
        success: false,
        message: `资料完成度不足（${profileCompletion}%），需达到 ${REQUIRED_PROFILE_COMPLETION}% 才能报名`,
      }
    }

    // 4. 检查问卷完成度
    const questionnaire = await this.prisma.questionnaire.findUnique({ where: { userId } })
    if (!questionnaire) {
      return { success: false, message: '请先完成问卷才能报名' }
    }
    const answers = questionnaire.answers as Record<string, string | string[]>
    // 排除 _submitted 字段，只统计真正的题目答案
    const answeredCount = Object.entries(answers)
      .filter(([k, v]) => k !== '_submitted' && v && (Array.isArray(v) ? v.length > 0 : true))
      .length
    if (answeredCount < QUESTIONNAIRE_TOTAL_QUESTIONS) {
      return {
        success: false,
        message: `问卷未完全填写（${answeredCount}/${QUESTIONNAIRE_TOTAL_QUESTIONS} 题），请先完成问卷`,
      }
    }

    // 5. 创建或恢复报名记录
    if (existing) {
      // 曾取消过，重新报名
      await this.prisma.roundParticipant.update({
        where: { roundId_userId: { roundId: round.id, userId } },
        data: { cancelledAt: null, joinedAt: new Date() },
      })
    } else {
      await this.prisma.roundParticipant.create({
        data: { roundId: round.id, userId },
      })
    }

    // 6. 更新参与人数
    const participantCount = await this.prisma.roundParticipant.count({
      where: { roundId: round.id, cancelledAt: null },
    })
    await this.prisma.matchingRound.update({
      where: { id: round.id },
      data: { participantCount },
    })

    return { success: true, message: '报名成功' }
  }

  async getResult(userId: string) {
    // 找当前用户最近一次匹配记录
    const match = await this.prisma.matchResult.findFirst({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: { include: { profile: true, questionnaire: { select: { answers: true } } } },
        userB: { include: { profile: true, questionnaire: { select: { answers: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!match) {
      return { matched: false, message: '暂未匹配到结果，请耐心等待' }
    }

    const isA = match.userAId === userId
    const partner = isA ? match.userB : match.userA
    const partnerProfile = isA ? match.userB.profile : match.userA.profile
    const myAnswers = isA ? match.userA.questionnaire?.answers : match.userB.questionnaire?.answers
    const partnerAnswers = isA ? match.userB.questionnaire?.answers : match.userA.questionnaire?.answers

    // 计算契合度详情
    let compatibilityDetail: { totalScore: number; dimensionBreakdown: Record<string, number> } | null = null
    if (myAnswers && partnerAnswers) {
      const { totalScore, dimensionBreakdown } = calculateCompatibilityScore(
        myAnswers as Record<string, string | string[]>,
        partnerAnswers as Record<string, string | string[]>
      )
      compatibilityDetail = { totalScore, dimensionBreakdown }
    }

    return {
      matched: true,
      nickname: partnerProfile?.nickname ?? '神秘同学',
      major: partnerProfile?.major ?? '',
      bio: partnerProfile?.bio ?? '',
      avatarUrl: partnerProfile?.avatarUrl ?? '',
      tags: partnerProfile?.tags ?? [],
      status: match.status.toLowerCase(),
      accepted: isA ? match.userAAccepted : match.userBAccepted,
      similarityScore: match.similarityScore,
      compatibilityDetail: compatibilityDetail ?? undefined,
    }
  }

  async accept(userId: string) {
    const match = await this.prisma.matchResult.findFirst({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      orderBy: { createdAt: 'desc' },
    })
    if (!match) {
      throw new NotFoundException('未找到匹配记录')
    }

    const isA = match.userAId === userId
    const updateData = isA
      ? { userAAccepted: true }
      : { userBAccepted: true }

    // 检查是否双方都接受了
    const updated = await this.prisma.matchResult.update({
      where: { id: match.id },
      data: updateData,
    })
    const otherAccepted = isA ? updated.userBAccepted : updated.userAAccepted
    if (otherAccepted) {
      await this.prisma.matchResult.update({
        where: { id: match.id },
        data: { status: 'ACCEPTED' },
      })
    }

    return { success: true, status: 'accepted' }
  }

  async decline(userId: string) {
    const match = await this.prisma.matchResult.findFirst({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      orderBy: { createdAt: 'desc' },
    })
    if (!match) {
      throw new NotFoundException('未找到匹配记录')
    }

    const isA = match.userAId === userId
    await this.prisma.matchResult.update({
      where: { id: match.id },
      data: isA ? { userAAccepted: false, status: 'DECLINED' } : { userBAccepted: false, status: 'DECLINED' },
    })

    return { success: true, status: 'declined' }
  }

  /**
   * 执行一轮匹配（管理员接口）
   * 1. 获取当前 OPEN 轮次的所有参与者
   * 2. 收集每个人的问卷答案
   * 3. 使用贪心稳定匹配算法配对
   * 4. 将结果写入 MatchResult 表
   * 5. 将轮次状态改为 RUNNING
   */
  async runMatching(): Promise<{
    success: boolean
    message: string
    stats: {
      participants: number
      pairs: number
      unmatched: number
      avgScore: number
      minScore: number
      maxScore: number
    }
  }> {
    // 1. 找当前轮次
    const round = await this.prisma.matchingRound.findFirst({
      where: { status: 'OPEN' },
      orderBy: { roundNumber: 'desc' },
    })
    if (!round) {
      return { success: false, message: '没有开放的匹配轮次', stats: { participants: 0, pairs: 0, unmatched: 0, avgScore: 0, minScore: 0, maxScore: 0 } }
    }

    // 2. 获取有效参与者（未取消）
    const participants = await this.prisma.roundParticipant.findMany({
      where: { roundId: round.id, cancelledAt: null },
      include: {
        user: {
          include: {
            questionnaire: { select: { answers: true } },
            profile: { select: { gender: true } },
          },
        },
      },
    })

    if (participants.length < 2) {
      return {
        success: false,
        message: `参与者不足（${participants.length} 人），至少需要 2 人`,
        stats: { participants: participants.length, pairs: 0, unmatched: participants.length, avgScore: 0, minScore: 0, maxScore: 0 },
      }
    }

    // 3. 准备匹配数据
    const matchData = participants
      .filter(p => p.user.questionnaire?.answers)
      .map(p => ({
        userId: p.userId,
        answers: p.user.questionnaire!.answers as Record<string, string | string[]>,
      }))

    // 4. 过滤已在本轮有匹配的用户（防止重复匹配）
    const alreadyMatched = new Set<string>()
    const existingMatches = await this.prisma.matchResult.findMany({
      where: { roundId: round.id },
      select: { userAId: true, userBId: true },
    })
    for (const m of existingMatches) {
      alreadyMatched.add(m.userAId)
      alreadyMatched.add(m.userBId)
    }

    const unmatchedData = matchData.filter(p => !alreadyMatched.has(p.userId))

    if (unmatchedData.length < 2) {
      return { success: false, message: '所有用户已完成匹配或无有效问卷', stats: { participants: matchData.length, pairs: 0, unmatched: unmatchedData.length, avgScore: 0, minScore: 0, maxScore: 0 } }
    }

    // 5. 执行贪心稳定匹配
    const pairs = greedyStableMatch(unmatchedData)

    if (pairs.length === 0) {
      return { success: false, message: '匹配算法未能产生配对', stats: { participants: unmatchedData.length, pairs: 0, unmatched: unmatchedData.length, avgScore: 0, minScore: 0, maxScore: 0 } }
    }

    // 6. 写入 MatchResult
    await this.prisma.$transaction(
      pairs.map(pair =>
        this.prisma.matchResult.create({
          data: {
            roundId: round.id,
            userAId: pair.userAId,
            userBId: pair.userBId,
            similarityScore: pair.score,
            status: 'PENDING',
          },
        })
      )
    )

    // 7. 更新轮次状态
    await this.prisma.matchingRound.update({
      where: { id: round.id },
      data: { status: 'RUNNING' },
    })

    // 8. 统计信息
    const scores = pairs.map(p => p.score)
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length

    return {
      success: true,
      message: `第 ${round.roundNumber} 期匹配完成，共 ${pairs.length} 对`,
      stats: {
        participants: matchData.length,
        pairs: pairs.length,
        unmatched: matchData.length - pairs.length * 2,
        avgScore: Math.round(avgScore),
        minScore: Math.min(...scores),
        maxScore: Math.max(...scores),
      },
    }
  }

  /**
   * 获取匹配推荐列表（按相似度排序，供用户浏览）
   */
  async getRecommendations(userId: string, limit = 10) {
    const myQ = await this.prisma.questionnaire.findUnique({ where: { userId } })
    if (!myQ) return { recommendations: [] }

    const myAnswers = myQ.answers as Record<string, string | string[]>

    // 找已完成问卷的其他用户
    const others = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        questionnaire: { isNot: null },
        profile: { isNot: null },
      },
      include: {
        questionnaire: { select: { answers: true } },
        profile: { select: { nickname: true, gender: true, major: true, avatarUrl: true, mbti: true, bio: true, tags: true } },
      },
    })

    if (others.length === 0) return { recommendations: [] }

    const ranked = rankCandidates(
      myAnswers,
      others.map(o => ({ userId: o.id, answers: o.questionnaire!.answers as Record<string, string | string[]> }))
    )

    const result = ranked.slice(0, limit).map(r => {
      const other = others.find(o => o.id === r.partnerId)!
      return {
        userId: other.id,
        score: r.score,
        breakdown: r.breakdown,
        nickname: other.profile?.nickname ?? '神秘同学',
        gender: other.profile?.gender ?? 'UNDISCLOSED',
        major: other.profile?.major ?? '',
        avatarUrl: other.profile?.avatarUrl ?? '',
        mbti: other.profile?.mbti ?? '',
        bio: other.profile?.bio ?? '',
        tags: other.profile?.tags ?? [],
      }
    })

    return { recommendations: result }
  }
}
