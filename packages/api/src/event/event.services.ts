import { LogSnag } from '@logsnag/node';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EventService {
  private readonly eventLog: LogSnag;

  constructor(private readonly configService: ConfigService) {
    this.eventLog = new LogSnag({
      token:   this.configService.get('LOGSNAG_TOKEN'),
      project: this.configService.get('LOGSNAG_PROJECT_NAME'),

      // disableTracking: process.env.NODE_ENV !== 'production',
    });
  }
  getLogger() {
    return this.eventLog;
  }
}
