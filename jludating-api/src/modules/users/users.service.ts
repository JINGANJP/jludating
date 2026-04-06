import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        status: true,
        isVerified: true,
        profile: {
          select: {
            nickname: true,
            grade: true,
            major: true,
            department: true,
            avatarUrl: true,
            profileCompletion: true,
          },
        },
      },
    })
    if (!user) throw new NotFoundException('用户不存在')
    return user
  }

  async getHistory(userId: string) {
    const matches = await this.prisma.matchResult.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        round: {
          select: { roundNumber: true, status: true },
        },
        userA: {
          select: {
            id: true,
            profile: {
              select: { nickname: true, avatarUrl: true },
            },
          },
        },
        userB: {
          select: {
            id: true,
            profile: {
              select: { nickname: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return matches.map((m) => {
      const isA = m.userAId === userId
      const other = isA ? m.userB : m.userA
      return {
        roundNumber: m.round.roundNumber,
        otherUser: {
          id: other.id,
          nickname: other.profile?.nickname ?? '未设置昵称',
          avatarUrl: other.profile?.avatarUrl,
        },
        status: m.status,
        myDecision: isA ? m.userAAccepted : m.userBAccepted,
        createdAt: m.createdAt,
      }
    })
  }
}
