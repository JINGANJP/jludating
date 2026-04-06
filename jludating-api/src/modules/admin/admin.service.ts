import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    // 本周新注册（过去 7 天）
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [registrationsThisWeek, currentRound] = await Promise.all([
      this.prisma.user.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      this.prisma.matchingRound.findFirst({
        where: { status: { in: ['OPEN', 'RUNNING'] } },
        orderBy: { roundNumber: 'desc' },
      }),
    ])

    // 计算历史成功率（ACCEPTED / 所有已完成匹配）
    const [totalMatches, acceptedMatches] = await Promise.all([
      this.prisma.matchResult.count(),
      this.prisma.matchResult.count({ where: { status: 'ACCEPTED' } }),
    ])

    const matchRate = totalMatches > 0 ? acceptedMatches / totalMatches : 0

    return {
      registrationsThisWeek,
      participantCount: currentRound?.participantCount ?? 0,
      matchRate: Math.round(matchRate * 100) / 100,
    }
  }

  async createNewRound() {
    // 检查是否已有开放轮次
    const existingOpen = await this.prisma.matchingRound.findFirst({
      where: { status: 'OPEN' },
    })
    if (existingOpen) {
      return {
        success: false,
        message: `当前已有第 ${existingOpen.roundNumber} 期开放轮次，无需重复创建`,
      }
    }

    // 获取最新期数
    const latest = await this.prisma.matchingRound.findFirst({
      orderBy: { roundNumber: 'desc' },
    })
    const nextNumber = (latest?.roundNumber ?? 0) + 1

    const now = new Date()
    const endDate = new Date(now)
    endDate.setDate(endDate.getDate() + 14) // 默认 2 周后截止

    const round = await this.prisma.matchingRound.create({
      data: {
        roundNumber: nextNumber,
        status: 'OPEN',
        startDate: now,
        endDate,
        participantCount: 0,
      },
    })

    return {
      success: true,
      message: `第 ${round.roundNumber} 期已创建，报名截止 ${endDate.toLocaleDateString('zh-CN')}`,
      roundNumber: round.roundNumber,
    }
  }

  async getWhitelist() {
    const list = await this.prisma.emailWhitelist.findMany({
      orderBy: { domain: 'asc' },
    })
    return list.map(item => ({
      domain: item.domain,
      university: item.university,
      active: item.isActive,
    }))
  }
}
