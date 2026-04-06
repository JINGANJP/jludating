import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { Request } from 'express'

export interface CurrentUserPayload {
  userId: string
  email: string
}

declare module 'express' {
  interface Request {
    user?: CurrentUserPayload
  }
}

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>()
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('请先登录')
    }
    try {
      const payload = this.jwtService.verify<{ sub: string; email: string }>(
        auth.slice(7),
      )
      req.user = { userId: payload.sub, email: payload.email }
      return true
    } catch {
      throw new UnauthorizedException('Token 已失效，请重新登录')
    }
  }
}

