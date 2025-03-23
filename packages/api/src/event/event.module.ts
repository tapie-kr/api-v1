import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventService } from '@/event/event.services';

@Module({
  imports:     [ConfigModule],
  controllers: [],
  providers:   [EventService],
  exports:     [EventService],
})
export class EventModule {
}
