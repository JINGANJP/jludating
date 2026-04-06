import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { randomInt } from 'node:crypto'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../redis/redis.service'
import { MailService } from '../../mail/mail.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

const CODE_EXPIRE_SECONDS = 10 * 60 // 10 分钟
const CODE_PREFIX = 'auth:code:'
const VERIFIED_PREFIX = 'auth:verified:' // 验证码校验通过标记
const REFRESH_PREFIX = 'auth:refresh:'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async sendCode(email: string) {
    // 校验是否为白名单域名
    const domain = email.split('@')[1] ?? ''
    const whitelist = await this.prisma.emailWhitelist.findUnique({
      where: { domain },
    })
    if (!whitelist) {
      return {
        message: `当前仅支持高校机构邮箱注册，${domain} 暂未开放。`,
        allowed: false,
      }
    }

    // 生成 6 位验证码
    const code = String(randomInt(100000, 999999))

    // 存入 Redis，10 分钟过期
    const redis = this.redis.getClient()
    await redis.setex(`${CODE_PREFIX}${email}`, CODE_EXPIRE_SECONDS, code)

    // 发送邮件（失败打印错误，不阻断主流程）
    this.mail.sendVerificationCode(email, code).catch((err: unknown) => {
      const e = err as Error
      console.error(`[Mail] ❌ 验证码发送失败 → ${e.message}`)
    })

    return {
      message: `验证码已发送到 ${email}，10 分钟内有效。`,
      allowed: true,
    }
  }

  async verifyCode(email: string, code: string) {
    const redis = this.redis.getClient()
    const stored = await redis.get(`${CODE_PREFIX}${email}`)

    if (!stored || stored !== code) {
      throw new BadRequestException('验证码错误或已过期')
    }

    // 验证码校验后删除，并标记该邮箱已通过验证（10分钟有效，与验证码同生命周期）
    await redis.del(`${CODE_PREFIX}${email}`)
    await redis.setex(`${VERIFIED_PREFIX}${email}`, CODE_EXPIRE_SECONDS, '1')

    return { email, verified: true }
  }

  async register(payload: RegisterDto) {
    const { email, code, password } = payload

    // 检查邮箱是否已通过验证码校验（第一步 verifyCode 设置的标记）
    const redis = this.redis.getClient()
    const verified = await redis.get(`${VERIFIED_PREFIX}${email}`)
    if (!verified) {
      throw new BadRequestException('请先完成邮箱验证')
    }
    // 清除验证标记，防止重复使用
    await redis.del(`${VERIFIED_PREFIX}${email}`)

    // 邮箱唯一性检查
    const exists = await this.prisma.user.findUnique({ where: { email } })
    if (exists) {
      throw new BadRequestException('该邮箱已注册，请直接登录')
    }

    // 密码哈希 + 创建用户
    const passwordHash = await bcrypt.hash(password, 12)

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        status: 'ACTIVE',
        isVerified: true,
        profile: {
          create: {
            nickname: email.split('@')[0], // 默认昵称为邮箱前缀
          },
        },
      },
      select: { id: true, email: true, status: true },
    })

    // 签发 JWT
    const tokens = this._issueTokens(user.id, user.email)

    // refresh token 存入 Redis（7 天）
    await redis.setex(
      `${REFRESH_PREFIX}${user.id}`,
      7 * 24 * 60 * 60,
      tokens.refreshToken,
    )

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
      },
    }
  }

  async login(payload: LoginDto) {
    const { email, password } = payload

    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误')
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      throw new UnauthorizedException('邮箱或密码错误')
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('账号已被限制，请联系管理员')
    }

    if (user.status === 'DELETED') {
      throw new BadRequestException('账号已注销')
    }

    const tokens = this._issueTokens(user.id, user.email)
    const redis = this.redis.getClient()
    await redis.setex(
      `${REFRESH_PREFIX}${user.id}`,
      7 * 24 * 60 * 60,
      tokens.refreshToken,
    )

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
      },
    }
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify<{ sub: string; email: string }>(
        refreshToken,
        {
          secret: this.config.getOrThrow('JWT_SECRET'),
        },
      )

      const redis = this.redis.getClient()
      const stored = await redis.get(`${REFRESH_PREFIX}${payload.sub}`)

      if (!stored || stored !== refreshToken) {
        throw new UnauthorizedException('Refresh token 已失效')
      }

      const tokens = this._issueTokens(payload.sub, payload.email)
      await redis.setex(
        `${REFRESH_PREFIX}${payload.sub}`,
        7 * 24 * 60 * 60,
        tokens.refreshToken,
      )

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
      }
    } catch {
      throw new UnauthorizedException('无效的 refresh token')
    }
  }

  async logout(userId: string) {
    const redis = this.redis.getClient()
    await redis.del(`${REFRESH_PREFIX}${userId}`)
    return { success: true }
  }

  /** 签发 access token + refresh token */
  private _issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email }
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
    })
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow('JWT_SECRET'),
      expiresIn: '7d',
    })
    return { accessToken, refreshToken }
  }
}
