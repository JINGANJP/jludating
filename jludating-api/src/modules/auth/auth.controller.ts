import { Body, Controller, Post, Req } from '@nestjs/common'
import type { Request } from 'express'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  sendCode(@Body('email') email: string) {
    return this.authService.sendCode(email)
  }

  @Post('verify-code')
  verifyCode(@Body('email') email: string, @Body('code') code: string) {
    return this.authService.verifyCode(email, code)
  }

  @Post('register')
  register(@Body() payload: RegisterDto) {
    return this.authService.register(payload)
  }

  @Post('login')
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload)
  }

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
