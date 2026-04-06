import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as jwt from 'jsonwebtoken'
import type { Request } from 'express'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const auth = request.headers.authorization
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('请先登录')
    }
    const token = auth.slice(7)
    try {
      const payload = jwt.verify(token, this.config.getOrThrow<string>('JWT_SECRET')) as {
        sub: string
        email: string
      }
      ;(request as Request & { user: { userId: string; email: string } }).user = {
        userId: payload.sub,
        email: payload.email,
      }
      return true
    } catch {
      throw new UnauthorizedException('Token 已过期，请重新登录')
    }
  }
}
