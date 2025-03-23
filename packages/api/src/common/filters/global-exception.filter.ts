import { APIResponseDto } from '@/common/dto/response.dto';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SentryExceptionCaptured } from '@sentry/nestjs';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly configService = new ConfigService();

  @SentryExceptionCaptured()
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = exception.message || 'Internal Server Error';
    let errorDetailData: unknown = {};
    let errorResponse: {
      message?: unknown;
    } = {};

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        errorResponse = exceptionResponse;

        errorDetailData = errorResponse.message || message;
      }
    }

    const apiResponse = new APIResponseDto();

    apiResponse.status = status;

    apiResponse.message = message;

    apiResponse.data = { reason: errorDetailData || undefined };

    response.status(status).send(apiResponse);

    if (status == HttpStatus.NOT_FOUND) return;

    this.logger.error(exception);

    const isProduction = this.configService.get('NODE_ENV') === 'production';

    if (!isProduction) {
      console.error(exception);
    }
  }
}
