import { EmailService } from '@/email/email.service'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports:     [ConfigModule],
  controllers: [],
  providers:   [EmailService],
  exports:     [EmailService],
})
export class EmailModule {
}
