import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator'

export class RegisterDto {
  @IsEmail()
  email!: string

  // 验证码已在 verifyCode 步骤校验，register 不再重复校验
  @IsOptional()
  @IsString()
  code?: string

  @IsString()
  @MinLength(12, { message: '密码至少需要 12 位' })
  @Matches(/[A-Z]/, { message: '密码必须包含至少一个大写字母' })
  @Matches(/[a-z]/, { message: '密码必须包含至少一个小写字母' })
  @Matches(/\d/, { message: '密码必须包含至少一个数字' })
  @Matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, { message: '密码必须包含至少一个特殊字符 (!@#$%^&*等)' })
  password!: string
}
