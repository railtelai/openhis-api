/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, LoggerService } from '@nestjs/common';
import pino from 'pino';

@Injectable()
export class PinoLoggerService implements LoggerService {
  private readonly logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
  });

  log(message: string, context?: any): void {
    this.logger.info({ context }, message);
  }

  error(message: string, trace?: any, context?: any): void {
    this.logger.error({ context, trace }, message);
  }

  warn(message: string, context?: any): void {
    this.logger.warn({ context }, message);
  }

  debug(message: string, context?: any): void {
    this.logger.debug({ context }, message);
  }

  verbose(message: string, context?: any): void {
    this.logger.trace({ context }, message);
  }
}
