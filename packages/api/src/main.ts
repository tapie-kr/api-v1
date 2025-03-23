import { AppModule } from '@/app.module';
import { APIResponseDto } from '@/common/dto/response.dto';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { PrismaExceptionFilter } from '@/common/filters/prisma-exception.filter';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';

import './instrument';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('bootstrap');
  const isProduction = configService.get('NODE_ENV') === 'production';

  if (isProduction) {
    logger.log('Running in production mode');
  }

  app.useGlobalFilters(new PrismaExceptionFilter());

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalInterceptors(new TransformInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(cookieParser());

  app.enableCors({
    origin: [
      'https://tapie.kr',
      'https://api.tapie.kr',
      'https://admin.tapie.kr',
      'https://auth.tapie.kr',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // if (!isProduction) {
  if (true) {
    const theme = new SwaggerTheme();

    const config = new DocumentBuilder()
      .setTitle('TAPIE API')
      .setDescription('TAPIE System API')
      .addCookieAuth(
        'accessToken',
        {
          type: 'apiKey',
          in: 'cookie',
        },
        'accessToken',
      )
      .addCookieAuth(
        'refreshToken',
        {
          type: 'apiKey',
          in: 'cookie',
        },
        'refreshToken',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      extraModels: [APIResponseDto],
    });

    SwaggerModule.setup('api-docs', app, document, {
      jsonDocumentUrl: 'api-docs/json',
      explorer: true,
      yamlDocumentUrl: 'api-docs/yaml',
      customCss: theme.getBuffer(SwaggerThemeNameEnum.ONE_DARK),
      customfavIcon: 'https://s3.tapie.kr/tapie-static/favicon.ico',
      customSiteTitle: 'TAPIE API Swagger',
    });
  }

  app.getHttpAdapter().get('/', (_req, res) => {
    res.json({
      status: 'ok',
      availableVersions: ['v1'],
    });
  });

  await app.listen(
    isProduction ? Number(configService.get('PORT') || 3000) : 8877,
    '0.0.0.0',
  );

  logger.log(`Server running on ${await app.getUrl()}`);
}

bootstrap().then();
