import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { user: { select: { email: true } } },
    })
    if (!profile) {
      return {
        nickname: '',
        avatarUrl: '',
        bio: '',
        gender: null,
        grade: '',
        major: '',
        department: '',
        mbti: '',
        tags: [],
        hometown: '',
        profileCompletion: 0,
      }
    }
    return {
      nickname: profile.nickname ?? '',
      avatarUrl: profile.avatarUrl ?? '',
      bio: profile.bio ?? '',
      gender: profile.gender,
      grade: profile.grade ?? '',
      major: profile.major ?? '',
      department: profile.department ?? '',
      mbti: profile.mbti ?? '',
      tags: profile.tags ?? [],
      hometown: profile.hometown ?? '',
      profileCompletion: profile.profileCompletion,
      email: profile.user.email,
    }
  }

  async updateProfile(userId: string, payload: Record<string, unknown>) {
    // 计算完成度（根据关键字段是否填写）
    const completionFields = ['nickname', 'gender', 'grade', 'major', 'department', 'hometown', 'mbti', 'bio']
    const filled = completionFields.filter(f => {
      const v = payload[f]
      return v !== undefined && v !== '' && v !== null
    }).length
    const profileCompletion = Math.round((filled / completionFields.length) * 100)

    const data = {
      ...(payload.nickname !== undefined && { nickname: String(payload.nickname) }),
      ...(payload.avatarUrl !== undefined && { avatarUrl: String(payload.avatarUrl) }),
      ...(payload.bio !== undefined && { bio: String(payload.bio) }),
      ...(payload.gender !== undefined && { gender: payload.gender as 'MALE' | 'FEMALE' | 'UNDISCLOSED' | null }),
      ...(payload.grade !== undefined && { grade: String(payload.grade) }),
      ...(payload.major !== undefined && { major: String(payload.major) }),
      ...(payload.department !== undefined && { department: String(payload.department) }),
      ...(payload.mbti !== undefined && { mbti: String(payload.mbti) }),
      ...(payload.tags !== undefined && { tags: payload.tags as string[] }),
      ...(payload.hometown !== undefined && { hometown: String(payload.hometown) }),
      profileCompletion,
    }
    const profile = await this.prisma.profile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...(data as Record<string, string | number | null | string[]>) },
    })
    return { success: true, profile }
  }
}
