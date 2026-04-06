import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis(this.configService.getOrThrow<string>('REDIS_URL'), {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    })
    await this.client.connect()
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit()
    }
  }

  getClient() {
    return this.client
  }
}
