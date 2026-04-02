import 'dotenv/config';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from './config/services/config.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  app.enableShutdownHooks();

  const config = app.get(ConfigService);

  app.use(compression({ threshold: 1024 }));

  // In production, use Helmet's secure defaults (CSP enabled).
  // In development/test, disable CSP so Swagger UI (inline scripts/styles) works.
  app.use(
    config.isProduction ? helmet() : helmet({ contentSecurityPolicy: false }),
  );

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.enableCors({
    origin: config.get('FRONTEND_URL'),
    credentials: true,
  });

  if (!config.isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('TrackTalk API')
      .setDescription('REST API documentation')
      .setVersion('1.0')
      .addCookieAuth('access_token')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(config.get('PORT'));
}

bootstrap().catch((err) => {
  console.error(err);
});
