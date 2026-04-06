import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export interface CurrentUserPayload {
  userId: string
  email: string
}

/**
 * 用法示例：
 *   @Get('profile')
 *   getProfile(@CurrentUser() user: CurrentUserPayload) {
 *     return user.userId
 *   }
 *
 *   // 只取 userId
 *   @Get('profile')
 *   getProfile(@CurrentUser('userId') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (field: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user as CurrentUserPayload | undefined
    if (!user) return undefined
    return field ? user[field] : user
  },
)
