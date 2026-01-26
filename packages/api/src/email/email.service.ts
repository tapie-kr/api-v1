import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import fs from 'node:fs'
import path from 'node:path'
import { Resend } from 'resend'

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {
  }
  async sendEmailHTMLWithArguments(
    from: string,
    to: string,
    reply_to: string,
    subject: string,
    htmlLocation: string,
    argumentsObj: Record<string, string>,
  ) {
    try {
      const filePath = path.join(__dirname, '../..', 'static', htmlLocation);

      let html = fs.readFileSync(filePath, 'utf-8');

      Object.keys(argumentsObj).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');

        html = html.replace(regex, argumentsObj[key]);
      });

      return this.sendEmailHTML(
        from, to, reply_to, subject, html,
      );
    } catch (error) {
      console.error('Error processing email template:', error);

      throw new Error('Failed to load and process email template');
    }
  }
  async sendEmailHTML(
    from: string, to: string, reply_to: string, subject: string, html: string,
  ) {
    try {
      const resend = new Resend(this.configService.get('RESEND_API_KEY'));

      const { data  } = await resend.emails.send({
        from:    from,
        to:      [to],
        subject: subject,
        html:    html,
        replyTo: reply_to,
      });

      return data;
    } catch (error) {
      console.error('Email send error:', error);

      throw new Error('Failed to send email');
    }
  }
}
