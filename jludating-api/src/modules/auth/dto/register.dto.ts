import { IsEmail, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator'

export class RegisterDto {
  @IsEmail()
  email!: string

  // 验证码已在 verifyCode 步骤校验，register 不再重复校验
  @IsOptional()
  @IsString()
  code?: string

  @IsString()
  @MinLength(8)
  @Matches(/[A-Za-z]/, { message: 'Password must contain at least one letter' })
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  password!: string
}
