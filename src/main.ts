/* src/main.ts */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import { ValidationPipe, Logger } from '@nestjs/common';

import { DecryptBodyInterceptor } from './interceptors/body.interceptor';
import { EncryptResponseInterceptor } from './interceptors/response.interceptor';

const logger = new Logger('Bootstrap');
dotenv.config({ path: '.env' });

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.use(bodyParser.text({ type: '*/*' }));

  app.useGlobalInterceptors(new DecryptBodyInterceptor(), new EncryptResponseInterceptor());

  app.use(cookieParser());

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT) || 2001;
  await app.listen(port);
  logger.log(`Server running on http://localhost:${port}`);
}

void bootstrap();
