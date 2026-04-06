import { Body, Controller, Post, Req } from '@nestjs/common'
import { Throttle, SkipThrottle } from '@nestjs/throttler'
import type { Request } from 'express'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 验证码发送：60秒最多3次
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('send-code')
  sendCode(@Body('email') email: string) {
    return this.authService.sendCode(email)
  }

  // 验证码校验：60秒最多10次
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('verify-code')
  verifyCode(@Body('email') email: string, @Body('code') code: string) {
    return this.authService.verifyCode(email, code)
  }

  // 注册：60秒最多5次
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  register(@Body() payload: RegisterDto) {
    return this.authService.register(payload)
  }

  // 登录：60秒最多5次（防止暴力破解）
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload)
  }

  // Refresh token 不限流（避免用户体验问题）
  @SkipThrottle()
  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken)
  }

  @Post('logout')
  logout(@Req() req: Request) {
    // 从 JWT payload 获取 userId（后续接 Guard 后由 @CurrentUser 注入）
    const user = (req as any).user as { sub?: string } | undefined
    const userId = user?.sub
    if (!userId) {
      return { success: true }
    }
    return this.authService.logout(userId)
  }
}
