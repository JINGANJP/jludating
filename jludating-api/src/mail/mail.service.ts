import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import nodemailer from 'nodemailer'

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  private getTransporter() {
    const port = Number(this.configService.get<string>('MAIL_PORT') ?? 465)
    const isSSL = port === 465
    return nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port,
      secure: isSSL,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    })
  }

  async sendVerificationCode(to: string, code: string) {
    const transporter = this.getTransporter()
    return transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to,
      subject: 'JLUDating 验证码',
      text: `您的验证码是 ${code}，10 分钟内有效。`,
    })
  }
}
